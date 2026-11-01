<?php
header('Content-Type: application/json');
require 'db.php';

function fail(int $code, string $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Method not allowed');

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) fail(400, 'Invalid request');

$name = trim((string)($body['name'] ?? ''));
if ($name === '' || mb_strlen($name) > 100) fail(400, 'Please enter a name (up to 100 characters)');

$serviceMap = ['Dine In' => 'dine_in', 'Take Out' => 'take_out'];
$serviceType = $serviceMap[$body['orderType'] ?? ''] ?? null;
if (!$serviceType) fail(400, 'Invalid order type');

$items = $body['items'] ?? null;
if (!is_array($items) || count($items) === 0 || count($items) > 50) fail(400, 'Your cart is empty');

$sizeAdj = ['Small' => -20, 'Medium' => 0, 'Large' => 20];
$sugars  = ['0%', '25%', '50%', '75%', '100%'];
$serves  = ['Hot', 'Cold'];

$lookup = $pdo->prepare(
    "SELECT item_id, base_price, has_size, has_sugar, has_serve
     FROM tbl_menu_items WHERE item_id = ? AND is_available = 1"
);

$lines = [];
$subtotal = 0;

foreach ($items as $it) {
    $itemId = filter_var($it['itemId'] ?? null, FILTER_VALIDATE_INT);
    $qty    = filter_var($it['qty'] ?? null, FILTER_VALIDATE_INT);
    if (!$itemId || !$qty || $qty < 1 || $qty > 20) fail(400, 'Invalid item or quantity');

    $lookup->execute([$itemId]);
    $m = $lookup->fetch();
    if (!$m) fail(400, 'An item in your cart is no longer available');

    $size = $sugar = $serve = null;
    $price = (float)$m['base_price'];

    if ($m['has_size']) {
        $size = $it['size'] ?? '';
        if (!isset($sizeAdj[$size])) fail(400, 'Invalid size');
        $price += $sizeAdj[$size];
    }
    if ($m['has_sugar']) {
        $sugar = $it['sugarLevel'] ?? '';
        if (!in_array($sugar, $sugars, true)) fail(400, 'Invalid sugar level');
    }
    if ($m['has_serve']) {
        $serve = $it['serve'] ?? '';
        if (!in_array($serve, $serves, true)) fail(400, 'Invalid serve option');
    }

    $lines[] = [$itemId, $qty, $serve, $size, $sugar, $price];
    $subtotal += $price * $qty;
}

try {
    $pdo->beginTransaction();

    $pdo->prepare("INSERT INTO tbl_customers (customer_name) VALUES (?)")->execute([$name]);
    $customerId = (int)$pdo->lastInsertId();

    // temporary unique code, replaced below once we know the order id
    $tmpCode = 'T' . bin2hex(random_bytes(8));
    $pdo->prepare(
        "INSERT INTO tbl_orders
           (order_code, customer_id, order_type, service_type, order_status, subtotal, total_amount)
         VALUES (?, ?, 'self_order', ?, 'pending', ?, ?)"
    )->execute([$tmpCode, $customerId, $serviceType, $subtotal, $subtotal]);
    $orderId = (int)$pdo->lastInsertId();

    $insItem = $pdo->prepare(
        "INSERT INTO tbl_order_items
           (order_id, item_id, quantity, temperature, size, sugar_level, unit_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    foreach ($lines as [$itemId, $qty, $serve, $size, $sugar, $price]) {
        $insItem->execute([$orderId, $itemId, $qty, $serve, $size, $sugar, $price]);
    }

    $code = str_pad((string)$orderId, 3, '0', STR_PAD_LEFT);
    $pdo->prepare("UPDATE tbl_orders SET order_code = ? WHERE order_id = ?")->execute([$code, $orderId]);

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail(500, 'Could not save your order. Please try again.');
}

http_response_code(201);
echo json_encode(['orderCode' => $code, 'total' => round($subtotal, 2)]);