<?php
require_once __DIR__ . '/errors.php';

const SIZE_ADJ = ['Small' => -20, 'Medium' => 0, 'Large' => 20];
const SUGARS   = ['0%', '25%', '50%', '75%', '100%'];
const SERVES   = ['Hot', 'Cold'];

// Looks up every price in the database and validates every choice
function price_cart(PDO $pdo, $items): array {
    if (!is_array($items) || count($items) === 0 || count($items) > 50) {
        throw new ApiException(400, 'Your cart is empty');
    }

    $lookup = $pdo->prepare(
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
            if (!isset(SIZE_ADJ[$size])) throw new ApiException(400, 'Invalid size');
            $price += SIZE_ADJ[$size];
        }
        if ($m['has_sugar']) {
            $sugar = $it['sugarLevel'] ?? '';
            if (!in_array($sugar, SUGARS, true)) throw new ApiException(400, 'Invalid sugar level');
        }
        if ($m['has_serve']) {
            $serve = $it['serve'] ?? '';
            if (!in_array($serve, SERVES, true)) throw new ApiException(400, 'Invalid serve option');
        } else {
            $serve = $m['fixed_temp'];   // hot-only / iced-only drinks
        }

        $lines[] = [$itemId, $qty, $serve, $size, $sugar, $price];
        $subtotal += $price * $qty;
    }

    return ['lines' => $lines, 'subtotal' => round($subtotal, 2)];
}

// Saves the customer (if any), the order, and its items. The caller owns the transaction.
function create_order(PDO $pdo, ?string $customerName, string $orderType, string $serviceType,
                      ?int $cashierId, array $cart): array {
    $customerId = null;
    if ($customerName !== null) {
        $pdo->prepare("INSERT INTO tbl_customers (customer_name) VALUES (?)")->execute([$customerName]);
        $customerId = (int)$pdo->lastInsertId();
    }

    $tmpCode = 'T' . bin2hex(random_bytes(8));   // replaced below once the id is known
    $trackToken = bin2hex(random_bytes(16));      // secret the customer's phone uses to follow the order
    $pdo->prepare(
        "INSERT INTO tbl_orders
           (order_code, track_token, customer_id, cashier_id, order_type, service_type,
            order_status, subtotal, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)"
    )->execute([$tmpCode, $trackToken, $customerId, $cashierId, $orderType, $serviceType,
                $cart['subtotal'], $cart['subtotal']]);
    $orderId = (int)$pdo->lastInsertId();

    $ins = $pdo->prepare(
        "INSERT INTO tbl_order_items
           (order_id, item_id, quantity, temperature, size, sugar_level, unit_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    foreach ($cart['lines'] as [$itemId, $qty, $serve, $size, $sugar, $price]) {
        $ins->execute([$orderId, $itemId, $qty, $serve, $size, $sugar, $price]);
    }

    $code = str_pad((string)$orderId, 3, '0', STR_PAD_LEFT);
    $pdo->prepare("UPDATE tbl_orders SET order_code = ? WHERE order_id = ?")->execute([$code, $orderId]);

    return [$orderId, $code, $trackToken];
}