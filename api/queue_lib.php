<?php
const STATUS_MAP = [
    'pending'   => 'new',
    'preparing' => 'preparing',
    'ready'     => 'ready',
    'completed' => 'completed',
    'declined'  => 'declined',
];
const TYPE_MAP = ['dine_in' => 'Dine In', 'take_out' => 'Take Out'];

// $where may use the aliases o (tbl_orders), c (customers) and t (transactions)
function fetch_orders(PDO $pdo, string $where, array $params, string $orderBy = 'o.created_at ASC', int $limit = 500): array {
    $sql = "SELECT o.order_id, o.order_code, o.service_type, o.order_status,
                   o.decline_reason, o.decline_note,
                   o.subtotal, o.total_amount, o.created_at,
                   c.customer_name, t.payment_method, t.transaction_date, t.receipt_token
            FROM tbl_orders o
            LEFT JOIN tbl_customers c ON c.customer_id = o.customer_id
            LEFT JOIN tbl_transactions t ON t.order_id = o.order_id
            WHERE ($where)
            ORDER BY $orderBy
            LIMIT " . (int)$limit;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    // Fetch every order's items in one query
    $itemsByOrder = [];
    if ($orders) {
        $ids = array_map(fn($o) => (int)$o['order_id'], $orders);
        $marks = implode(',', array_fill(0, count($ids), '?'));
        $items = $pdo->prepare(
            "SELECT oi.order_id, m.item_name, oi.quantity, oi.size, oi.sugar_level,
                    oi.temperature, oi.unit_price
             FROM tbl_order_items oi
             JOIN tbl_menu_items m ON m.item_id = oi.item_id
             WHERE oi.order_id IN ($marks)
             ORDER BY oi.order_item_id"
        );
        $items->execute($ids);
        foreach ($items->fetchAll() as $r) {
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

    $iso = fn($d) => $d ? str_replace(' ', 'T', $d) : null;
    return array_map(fn($o) => [
        'id'            => (int)$o['order_id'],
        'code'          => $o['order_code'],
        'customer'      => $o['customer_name'] ?? 'Walk-in',
        'type'          => TYPE_MAP[$o['service_type']] ?? 'Dine In',
        'items'         => $itemsByOrder[$o['order_id']] ?? [],
        'subtotal'      => (float)$o['subtotal'],
        'total'         => (float)$o['total_amount'],
        'status'        => STATUS_MAP[$o['order_status']] ?? 'new',
        'createdAt'     => $iso($o['created_at']),
        'completedAt'   => $o['order_status'] === 'completed' ? $iso($o['transaction_date']) : null,
        'paymentMethod' => $o['payment_method'],
        'receiptToken'  => $o['receipt_token'],
        'declineReason' => $o['decline_reason'],
        'declineNote'   => $o['decline_note'],
    ], $orders);
}