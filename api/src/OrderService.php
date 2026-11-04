<?php
// Creates orders and moves them through their statuses. Prices always come from the database.
final class OrderService {
    private const SIZE_ADJ = ['Small' => -20, 'Medium' => 0, 'Large' => 20];
    private const SUGARS   = ['0%', '25%', '50%', '75%', '100%'];
    private const SERVES   = ['Hot', 'Cold'];
    private const SERVICE_TYPES = ['Dine In' => 'dine_in', 'Take Out' => 'take_out'];
    private const DECLINE_REASONS = ['Out of Stock', 'Kitchen Closing', 'Other'];

    // target (cashier screen name) => [database status, status the order must be in now].
    // pending -> preparing only happens through PaymentService.
    private const MOVES = [
        'ready'     => ['ready',     'preparing'],
        'completed' => ['completed', 'ready'],
        'declined'  => ['declined',  'pending'],
    ];

    public function __construct(private PDO $pdo) {}

    // "Dine In" / "Take Out" -> the tbl_orders.service_type value
    public static function serviceType(mixed $label): string {
        $type = is_string($label) ? (self::SERVICE_TYPES[$label] ?? null) : null;
        if (!$type) throw new ApiException(400, 'Invalid order type');
        return $type;
    }

    // A customer's order from their phone.
    // $requestId (optional) makes a retry safe: the same id returns the order it already
    // created instead of making a second one.
    // Returns [['orderCode', 'total', 'trackToken'], true if a new order was created].
    public function placeSelfOrder(string $name, string $serviceType, mixed $items, ?string $requestId = null): array {
        if ($requestId !== null && ($existing = $this->findByRequestId($requestId))) return [$existing, false];

        $this->pdo->beginTransaction();
        try {
            $cart = $this->priceCart($items);
            [, $code, $trackToken] = $this->create($name, 'self_order', $serviceType, null, $cart, $requestId);
            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            // The same id sent twice at once: the other request saved the order first
            if ($requestId !== null && self::isDuplicateKey($e, 'idempotency_key')
                && ($existing = $this->findByRequestId($requestId))) {
                return [$existing, false];
            }
            throw $e;
        }
        return [['orderCode' => $code, 'total' => $cart['subtotal'], 'trackToken' => $trackToken], true];
    }

    // The answer a request with this id got when it created the order, or null
    private function findByRequestId(string $requestId): ?array {
        $stmt = $this->pdo->prepare("SELECT order_code, subtotal, track_token FROM tbl_orders WHERE idempotency_key = ?");
        $stmt->execute([$requestId]);
        $row = $stmt->fetch();
        if (!$row) return null;
        // subtotal, not total_amount: a discount added at the counter later must not change the answer
        return ['orderCode' => $row['order_code'], 'total' => (float)$row['subtotal'], 'trackToken' => $row['track_token']];
    }

    private static function isDuplicateKey(Throwable $e, string $key): bool {
        return $e instanceof PDOException && $e->getCode() === '23000' && str_contains($e->getMessage(), $key);
    }

    // A walk-in order and its payment: both are saved or neither is. Returns the receipt fields.
    public function placeWalkIn(?string $name, string $serviceType, int $cashierId, array $input): array {
        $this->pdo->beginTransaction();
        try {
            $cart = $this->priceCart($input['items'] ?? null);
            [$orderId] = $this->create($name, 'walk_in', $serviceType, $cashierId, $cart);
            $receipt = (new PaymentService($this->pdo))->settle($orderId, $cashierId, $input);
            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        }
        return $receipt;
    }

    // ready / completed / declined, only from the status the order must be in now
    public function changeStatus(int $id, mixed $target, mixed $reason, mixed $note): void {
        if (!is_string($target) || !isset(self::MOVES[$target])) throw new ApiException(400, 'Invalid status');
        [$newStatus, $mustBe] = self::MOVES[$target];

        $declineReason = $declineNote = null;
        if ($target === 'declined') {
            if (!in_array($reason, self::DECLINE_REASONS, true)) throw new ApiException(400, 'Invalid decline reason');
            $declineReason = $reason;
            $declineNote = trim((string)$note);
            if (mb_strlen($declineNote) > 255) throw new ApiException(400, 'Note is too long (255 characters max)');
            if ($declineNote === '') $declineNote = null;
        }

        $stmt = $this->pdo->prepare(
            "UPDATE tbl_orders
             SET order_status = ?, decline_reason = ?, decline_note = ?
             WHERE order_id = ? AND order_status = ?"
        );
        $stmt->execute([$newStatus, $declineReason, $declineNote, $id, $mustBe]);

        if ($stmt->rowCount() === 0) {
            $cur = $this->pdo->prepare("SELECT order_status FROM tbl_orders WHERE order_id = ?");
            $cur->execute([$id]);
            $row = $cur->fetch();
            if (!$row) throw new ApiException(404, 'Order not found');
            throw new ApiException(409, 'This order is already ' . $row['order_status'] . '. Refresh the queue.');
        }
    }

    // Looks up every price in the database and validates every choice
    public function priceCart(mixed $items): array {
        if (!is_array($items) || count($items) === 0 || count($items) > 50) {
            throw new ApiException(400, 'Your cart is empty');
        }

        $lookup = $this->pdo->prepare(
            "SELECT item_id, base_price, has_size, has_sugar, has_serve, fixed_temp
             FROM tbl_menu_items WHERE item_id = ? AND is_available = 1"
        );

        $lines = [];
        $subtotal = 0;

        foreach ($items as $it) {
            if (!is_array($it)) throw new ApiException(400, 'Invalid item');
            $itemId = filter_var($it['itemId'] ?? null, FILTER_VALIDATE_INT);
            $qty    = filter_var($it['qty'] ?? null, FILTER_VALIDATE_INT);
            if (!$itemId || !$qty || $qty < 1 || $qty > 20) {
                throw new ApiException(400, 'Invalid item or quantity');
            }

            $lookup->execute([$itemId]);
            $m = $lookup->fetch();
            if (!$m) throw new ApiException(400, 'An item in your cart is no longer available');

            $size = $sugar = $serve = null;
            $price = (float)$m['base_price'];

            if ($m['has_size']) {
                $size = $it['size'] ?? '';
                if (!is_string($size) || !isset(self::SIZE_ADJ[$size])) throw new ApiException(400, 'Invalid size');
                $price += self::SIZE_ADJ[$size];
            }
            if ($m['has_sugar']) {
                $sugar = $it['sugarLevel'] ?? '';
                if (!in_array($sugar, self::SUGARS, true)) throw new ApiException(400, 'Invalid sugar level');
            }
            if ($m['has_serve']) {
                $serve = $it['serve'] ?? '';
                if (!in_array($serve, self::SERVES, true)) throw new ApiException(400, 'Invalid serve option');
            } else {
                $serve = $m['fixed_temp'];   // hot-only / iced-only drinks
            }

            $lines[] = [$itemId, $qty, $serve, $size, $sugar, $price];
            $subtotal += $price * $qty;
        }

        return ['lines' => $lines, 'subtotal' => round($subtotal, 2)];
    }

    // Saves the customer (if any), the order, and its items. The caller owns the transaction.
    // Returns [order id, order code, track token].
    private function create(?string $customerName, string $orderType, string $serviceType,
                            ?int $cashierId, array $cart, ?string $requestId = null): array {
        $customerId = null;
        if ($customerName !== null) {
            $this->pdo->prepare("INSERT INTO tbl_customers (customer_name) VALUES (?)")->execute([$customerName]);
            $customerId = (int)$this->pdo->lastInsertId();
        }

        $tmpCode = 'T' . bin2hex(random_bytes(8));   // replaced below once the id is known
        $trackToken = bin2hex(random_bytes(16));      // secret the customer's phone uses to follow the order
        $this->pdo->prepare(
            "INSERT INTO tbl_orders
               (order_code, track_token, idempotency_key, customer_id, cashier_id, order_type, service_type,
                order_status, subtotal, total_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)"
        )->execute([$tmpCode, $trackToken, $requestId, $customerId, $cashierId, $orderType, $serviceType,
                    $cart['subtotal'], $cart['subtotal']]);
        $orderId = (int)$this->pdo->lastInsertId();

        $ins = $this->pdo->prepare(
            "INSERT INTO tbl_order_items
               (order_id, item_id, quantity, temperature, size, sugar_level, unit_price)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        foreach ($cart['lines'] as [$itemId, $qty, $serve, $size, $sugar, $price]) {
            $ins->execute([$orderId, $itemId, $qty, $serve, $size, $sugar, $price]);
        }

        $code = str_pad((string)$orderId, 3, '0', STR_PAD_LEFT);
        $this->pdo->prepare("UPDATE tbl_orders SET order_code = ? WHERE order_id = ?")->execute([$code, $orderId]);

        return [$orderId, $code, $trackToken];
    }
}
