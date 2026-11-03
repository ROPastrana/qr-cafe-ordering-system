<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require 'db.php';

function fail(int $code, string $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail(405, 'Method not allowed');

$token = (string)($_GET['t'] ?? '');
if (!preg_match('/^[a-f0-9]{32}$/', $token)) fail(400, 'Invalid receipt link');

$stmt = $pdo->prepare(
    "SELECT t.receipt_number, t.payment_method, t.amount_paid, t.change_due,
            t.gcash_reference_no, t.transaction_date,
            o.order_id, o.order_code, o.service_type, o.discount_type,
            o.discount_amount, o.subtotal, o.total_amount, c.customer_name
     FROM tbl_transactions t
     JOIN tbl_orders o ON o.order_id = t.order_id
     LEFT JOIN tbl_customers c ON c.customer_id = o.customer_id
     WHERE t.receipt_token = ?"
);
$stmt->execute([$token]);
$r = $stmt->fetch();
if (!$r) fail(404, 'Receipt not found');

$itemsStmt = $pdo->prepare(
    "SELECT m.item_name, oi.quantity, oi.size, oi.sugar_level, oi.temperature, oi.unit_price
     FROM tbl_order_items oi JOIN tbl_menu_items m ON m.item_id = oi.item_id
     WHERE oi.order_id = ? ORDER BY oi.order_item_id"
);
$itemsStmt->execute([$r['order_id']]);
$items = array_map(function ($i) {
    $parts = [];
    if ($i['size'])        $parts[] = $i['size'];
    if ($i['sugar_level']) $parts[] = $i['sugar_level'] . ' Sugar';
    if ($i['temperature']) $parts[] = $i['temperature'];
    return [
        'name'      => $i['item_name'],
        'variant'   => $parts ? implode(' · ', $parts) : null,
        'qty'       => (int)$i['quantity'],
        'unitPrice' => (float)$i['unit_price'],
        'lineTotal' => round((float)$i['unit_price'] * (int)$i['quantity'], 2),
    ];
}, $itemsStmt->fetchAll());

$discountLabels = ['pwd' => 'PWD', 'senior' => 'Senior Citizen', 'student' => 'Student'];
$ref = $r['gcash_reference_no'];

echo json_encode([
    'receiptNumber' => $r['receipt_number'],
    'orderCode'     => $r['order_code'],
    'date'          => str_replace(' ', 'T', $r['transaction_date']),
    'customer'      => $r['customer_name'] ?? 'Walk-in',
    'type'          => $r['service_type'] === 'take_out' ? 'Take Out' : 'Dine In',
    'items'         => $items,
    'subtotal'      => (float)$r['subtotal'],
    'discountLabel' => $discountLabels[$r['discount_type']] ?? null,
    'discount'      => (float)$r['discount_amount'],
    'total'         => (float)$r['total_amount'],
    'method'        => $r['payment_method'],
    'amountPaid'    => (float)$r['amount_paid'],
    'change'        => (float)$r['change_due'],
    // Only the last 4 digits of the GCash reference are shown on a public page
    'gcashRef'      => $ref ? str_repeat('*', max(0, strlen($ref) - 4)) . substr($ref, -4) : null,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);