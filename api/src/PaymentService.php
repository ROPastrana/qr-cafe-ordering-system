<?php
// Settles an order: cash or GCash, optional 20% discount, then pending -> preparing.
final class PaymentService {
    private const DISCOUNT_RATE = 0.20;
    private const DISCOUNTS = ['PWD' => 'pwd', 'Senior Citizen' => 'senior', 'Student' => 'student'];

    public function __construct(private PDO $pdo) {}

    // $in: method, cashTendered or gcashRef, discountType. Returns the receipt fields.
    public function settle(int $orderId, int $cashierId, array $in): array {
        $method = $in['method'] ?? '';
        if (!in_array($method, ['cash', 'gcash'], true)) {
            throw new PayException(400, 'Choose cash or GCash');
        }

        $discountKey = $in['discountType'] ?? null;
        if ($discountKey !== null && (!is_string($discountKey) || !isset(self::DISCOUNTS[$discountKey]))) {
            throw new PayException(400, 'Invalid discount');
        }

        $own = !$this->pdo->inTransaction();   // a walk-in already opened one
        if ($own) $this->pdo->beginTransaction();
        try {
            // Lock the order row so two cashiers can't settle it at the same time
            $o = $this->pdo->prepare("SELECT order_id, order_code, order_status FROM tbl_orders WHERE order_id = ? FOR UPDATE");
            $o->execute([$orderId]);
            $order = $o->fetch();
            if (!$order) throw new PayException(404, 'Order not found');
            if ($order['order_status'] !== 'pending') {
                throw new PayException(409, 'This order is already ' . $order['order_status'] . '. Refresh the queue.');
            }

            // The total always comes from the saved items, never from the browser
            $s = $this->pdo->prepare("SELECT COALESCE(SUM(unit_price * quantity), 0) FROM tbl_order_items WHERE order_id = ?");
            $s->execute([$orderId]);
            $subtotal = round((float)$s->fetchColumn(), 2);
            if ($subtotal <= 0) throw new PayException(400, 'This order has no items');

            $discount = $discountKey ? round($subtotal * self::DISCOUNT_RATE, 2) : 0.00;
            $total = round($subtotal - $discount, 2);

            if ($method === 'cash') {
                $raw = $in['cashTendered'] ?? null;
                if (!is_numeric($raw)) throw new PayException(400, 'Enter the cash tendered');
                $tendered = round((float)$raw, 2);
                if ($tendered < $total) throw new PayException(400, 'Cash tendered is less than the total');
                $amountPaid = $tendered;
                $change = round($tendered - $total, 2);
                $ref = null;
            } else {
                $ref = $in['gcashRef'] ?? '';
                $ref = is_string($ref) ? trim($ref) : '';   // an array or number fails the check below
                if (!preg_match('/^[0-9]{10,13}$/', $ref)) {
                    throw new PayException(400, 'Enter the GCash reference number (10 to 13 digits)');
                }
                $amountPaid = $total;
                $change = 0.00;
            }

            $token = bin2hex(random_bytes(16));
            $receiptNo = 'RC-' . $order['order_code'] . '-' . date('Ymd');
            $this->saveTransaction($orderId, $cashierId, $amountPaid, $change, $method, $ref, $token, $receiptNo);

            $this->pdo->prepare(
                "UPDATE tbl_orders
                 SET order_status = 'preparing', cashier_id = ?, discount_type = ?,
                     discount_amount = ?, subtotal = ?, total_amount = ?
                 WHERE order_id = ?"
            )->execute([$cashierId, $discountKey ? self::DISCOUNTS[$discountKey] : 'none',
                        $discount, $subtotal, $total, $orderId]);

            if ($own) $this->pdo->commit();
        } catch (Throwable $e) {
            if ($own && $this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        }

        return [
            'orderCode'     => $order['order_code'],
            'receiptNumber' => $receiptNo,
            'receiptToken'  => $token,
            'method'        => $method,
            'subtotal'      => $subtotal,
            'discount'      => $discount,
            'total'         => $total,
            'amountPaid'    => $amountPaid,
            'change'        => $change,
        ];
    }

    // gcash_reference_no is UNIQUE, so a reused reference fails here
    private function saveTransaction(int $orderId, int $cashierId, float $amountPaid, float $change,
                                     string $method, ?string $ref, string $token, string $receiptNo): void {
        try {
            $this->pdo->prepare(
                "INSERT INTO tbl_transactions
                   (order_id, cashier_id, amount_paid, change_due, payment_method,
                    gcash_reference_no, receipt_token, receipt_number)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            )->execute([$orderId, $cashierId, $amountPaid, $change, $method, $ref, $token, $receiptNo]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000' && str_contains($e->getMessage(), 'gcash_reference_no')) {
                throw new PayException(409, 'That GCash reference number was already used for another order');
            }
            throw $e;
        }
    }
}
