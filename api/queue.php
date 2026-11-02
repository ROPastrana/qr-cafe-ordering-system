<?php
header('Content-Type: application/json; charset=utf-8');
require 'auth.php';
require_cashier();
require 'db.php';


// Database status -> the names the cashier screens use
$statusMap = [
    'pending'   => 'new',
    'preparing' => 'preparing',
    'ready'     => 'ready',
    'completed' => 'completed',
    'declined'  => 'declined',
];
$typeMap = ['dine_in' => 'Dine In', 'take_out' => 'Take Out'];

// Active orders always, plus anything from today (completed / declined)
$sql = "SELECT o.order_id, o.order_code, o.service_type, o.order_status,
               o.decline_reason, o.decline_note,
               o.subtotal, o.total_amount, o.created_at,
               c.customer_name, t.payment_method, t.transaction_date
        FROM tbl_orders o
        LEFT JOIN tbl_customers c ON c.customer_id = o.customer_id
        LEFT JOIN tbl_transactions t ON t.order_id = o.order_id
        WHERE o.order_status IN ('pending','preparing','ready')
           OR DATE(o.created_at) = CURDATE()
        ORDER BY o.created_at ASC";
$orders = $pdo->query($sql)->fetchAll();

// Fetch every order's items in one query
$itemsByOrder = [];
if ($orders) {
    $ids = array_map(fn($o) => (int)$o['order_id'], $orders);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare(
        "SELECT oi.order_id, m.item_name, oi.quantity, oi.size, oi.sugar_level,
                oi.temperature, oi.unit_price
         FROM tbl_order_items oi
         JOIN tbl_menu_items m ON m.item_id = oi.item_id
         WHERE oi.order_id IN ($placeholders)
         ORDER BY oi.order_item_id"
    );
    $stmt->execute($ids);
    foreach ($stmt->fetchAll() as $r) {
        $parts = [];
        if ($r['size'])        $parts[] = $r['size'];
        if ($r['sugar_level']) $parts[] = $r['sugar_level'] . ' Sugar';
        if ($r['temperature']) $parts[] = $r['temperature'];
        $itemsByOrder[$r['order_id']][] = [
            'name'      => $r['item_name'],
            'qty'       => (int)$r['quantity'],
            'variant'   => $parts ? implode(' · ', $parts) : null,
            'unitPrice' => (float)$r['unit_price'],
        ];
    }
}

$out = array_map(function ($o) use ($statusMap, $typeMap, $itemsByOrder) {
    $iso = fn($d) => $d ? str_replace(' ', 'T', $d) : null;
    return [
        'id'            => (int)$o['order_id'],
        'code'          => $o['order_code'],
        'customer'      => $o['customer_name'] ?? 'Walk-in',
        'type'          => $typeMap[$o['service_type']] ?? 'Dine In',
        'items'         => $itemsByOrder[$o['order_id']] ?? [],
        'subtotal'      => (float)$o['subtotal'],
        'total'         => (float)$o['total_amount'],
        'status'        => $statusMap[$o['order_status']] ?? 'new',
        'createdAt'     => $iso($o['created_at']),
        'completedAt'   => $o['order_status'] === 'completed' ? $iso($o['transaction_date']) : null,
        'paymentMethod' => $o['payment_method'],
        'declineReason' => $o['decline_reason'],
        'declineNote'   => $o['decline_note'],
    ];
}, $orders);

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);