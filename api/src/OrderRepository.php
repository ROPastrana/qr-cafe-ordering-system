<?php
// Reads orders for the cashier screens, the customer's tracking page and the e-receipt.
final class OrderRepository {
    // database status => cashier screen status
    private const STATUS_MAP = [
        'pending'   => 'new',
        'preparing' => 'preparing',
        'ready'     => 'ready',
        'completed' => 'completed',
        'declined'  => 'declined',
    ];
    private const TYPE_MAP = ['dine_in' => 'Dine In', 'take_out' => 'Take Out'];
    private const DISCOUNT_LABELS = ['pwd' => 'PWD', 'senior' => 'Senior Citizen', 'student' => 'Student'];
    private const HISTORY_LIMIT = 20000;   // most orders one history or sales report request may cover

    public function __construct(private PDO $pdo) {}

    // The cashier's live board: paid orders still in progress, unpaid orders from the last
    // 12 hours (older ones were abandoned), and today's completed / declined ones.
    // created_at is compared as a range (not DATE(created_at)) so its index can be used.
    // Paid orders are picked first, then the newest unpaid ones, so a flood of fake orders can't
    // push real orders off the 500-row board. Reversed at the end: oldest first on screen.
    public function queue(): array {
        return array_reverse($this->fetch(
            "o.order_status IN ('preparing','ready')
             OR (o.order_status = 'pending' AND o.created_at >= NOW() - INTERVAL 12 HOUR)
             OR (o.order_status IN ('completed','declined')
                 AND o.created_at >= CURDATE() AND o.created_at < CURDATE() + INTERVAL 1 DAY)",
            [],
            "CASE WHEN o.order_status IN ('preparing','ready') THEN 0
                  WHEN o.order_status = 'pending' THEN 1 ELSE 2 END, o.created_at DESC"
        ));
    }

    // Finished orders between two dates (YYYY-MM-DD), newest first.
    // $completedOnly: the sales report; otherwise completed and declined, for order history.
    public function history(string $from, string $to, bool $completedOnly): array {
        $statuses = $completedOnly ? ['completed'] : ['completed', 'declined'];
        $marks = implode(',', array_fill(0, count($statuses), '?'));
        // From the start of $from up to (not including) the day after $to, as a range on created_at
        $orders = $this->fetch(
            "o.order_status IN ($marks) AND o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)",
            [...$statuses, $from, $to],
            'o.created_at DESC',
            self::HISTORY_LIMIT + 1
        );
        // The sales report adds these rows up, so a cut-off list would give a wrong total: refuse instead
        if (count($orders) > self::HISTORY_LIMIT) {
            throw new ApiException(400, 'Too many orders in this range. Please choose a shorter date range.');
        }
        return $orders;
    }

    // What the customer's phone needs to follow an order, or null for an unknown token
    public function tracking(string $trackToken): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT o.order_code, o.order_status, o.decline_reason, o.decline_note, t.receipt_token
             FROM tbl_orders o
             LEFT JOIN tbl_transactions t ON t.order_id = o.order_id
             WHERE o.track_token = ?"
        );
        $stmt->execute([$trackToken]);
        $row = $stmt->fetch();
        if (!$row) return null;

        return [
            'code'          => $row['order_code'],
            'status'        => $row['order_status'],   // pending | preparing | ready | completed | declined
            'declineReason' => $row['decline_reason'],
            'declineNote'   => $row['decline_note'],
            'receiptToken'  => $row['receipt_token'],   // null until the order is paid
        ];
    }

    // A paid order as an e-receipt, or null for an unknown token
    public function receipt(string $receiptToken): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT t.receipt_number, t.payment_method, t.amount_paid, t.change_due,
                    t.gcash_reference_no, t.transaction_date,
                    o.order_id, o.order_code, o.service_type, o.discount_type,
                    o.discount_amount, o.subtotal, o.total_amount, c.customer_name
             FROM tbl_transactions t
             JOIN tbl_orders o ON o.order_id = t.order_id
             LEFT JOIN tbl_customers c ON c.customer_id = o.customer_id
             WHERE t.receipt_token = ?"
        );
        $stmt->execute([$receiptToken]);
        $r = $stmt->fetch();
        if (!$r) return null;

        $items = array_map(fn($i) => [
            'name'      => $i['name'],
            'variant'   => $i['variant'],
            'qty'       => $i['qty'],
            'unitPrice' => $i['unitPrice'],
            'lineTotal' => round($i['unitPrice'] * $i['qty'], 2),
        ], $this->itemsByOrder([(int)$r['order_id']])[$r['order_id']] ?? []);

        $ref = $r['gcash_reference_no'];
        return [
            'receiptNumber' => $r['receipt_number'],
            'orderCode'     => $r['order_code'],
            'date'          => self::isoTime($r['transaction_date']),
            'customer'      => $r['customer_name'] ?? 'Walk-in',
            'type'          => self::TYPE_MAP[$r['service_type']] ?? 'Dine In',
            'items'         => $items,
            'subtotal'      => (float)$r['subtotal'],
            'discountLabel' => self::DISCOUNT_LABELS[$r['discount_type']] ?? null,
            'discount'      => (float)$r['discount_amount'],
            'total'         => (float)$r['total_amount'],
            'method'        => $r['payment_method'],
            'amountPaid'    => (float)$r['amount_paid'],
            'change'        => (float)$r['change_due'],
            // Only the last 4 digits of the GCash reference are shown on a public page
            'gcashRef'      => $ref ? str_repeat('*', max(0, strlen($ref) - 4)) . substr($ref, -4) : null,
        ];
    }

    // $where may use the aliases o (tbl_orders), c (customers) and t (transactions)
    private function fetch(string $where, array $params, string $orderBy = 'o.created_at ASC', int $limit = 500): array {
        $stmt = $this->pdo->prepare(
            "SELECT o.order_id, o.order_code, o.service_type, o.order_status,
                    o.decline_reason, o.decline_note,
                    o.subtotal, o.total_amount, o.created_at,
                    c.customer_name, t.payment_method, t.transaction_date, t.receipt_token
             FROM tbl_orders o
             LEFT JOIN tbl_customers c ON c.customer_id = o.customer_id
             LEFT JOIN tbl_transactions t ON t.order_id = o.order_id
             WHERE ($where)
             ORDER BY $orderBy
             LIMIT " . (int)$limit
        );
        $stmt->execute($params);
        $orders = $stmt->fetchAll();
        $items = $this->itemsByOrder(array_map(fn($o) => (int)$o['order_id'], $orders));

        return array_map(fn($o) => [
            'id'            => (int)$o['order_id'],
            'code'          => $o['order_code'],
            'customer'      => $o['customer_name'] ?? 'Walk-in',
            'type'          => self::TYPE_MAP[$o['service_type']] ?? 'Dine In',
            'items'         => $items[$o['order_id']] ?? [],
            'subtotal'      => (float)$o['subtotal'],
            'total'         => (float)$o['total_amount'],
            'status'        => self::STATUS_MAP[$o['order_status']] ?? 'new',
            'createdAt'     => self::isoTime($o['created_at']),
            'completedAt'   => $o['order_status'] === 'completed' ? self::isoTime($o['transaction_date']) : null,
            'paymentMethod' => $o['payment_method'],
            'receiptToken'  => $o['receipt_token'],
            'declineReason' => $o['decline_reason'],
            'declineNote'   => $o['decline_note'],
        ], $orders);
    }

    // Every order's items in one query: [order_id => [['name', 'qty', 'variant', 'unitPrice'], ...]]
    private function itemsByOrder(array $orderIds): array {
        if (!$orderIds) return [];
        $marks = implode(',', array_fill(0, count($orderIds), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT oi.order_id, m.item_name, oi.quantity, oi.size, oi.sugar_level,
                    oi.temperature, oi.unit_price
             FROM tbl_order_items oi
             JOIN tbl_menu_items m ON m.item_id = oi.item_id
             WHERE oi.order_id IN ($marks)
             ORDER BY oi.order_item_id"
        );
        $stmt->execute($orderIds);

        $byOrder = [];
        foreach ($stmt->fetchAll() as $r) {
            $byOrder[$r['order_id']][] = [
                'name'      => $r['item_name'],
                'qty'       => (int)$r['quantity'],
                'variant'   => self::variant($r),
                'unitPrice' => (float)$r['unit_price'],
            ];
        }
        return $byOrder;
    }

    // "Large · 50% Sugar · Cold", or null for items without options (pastries)
    private static function variant(array $item): ?string {
        $parts = [];
        if ($item['size'])        $parts[] = $item['size'];
        if ($item['sugar_level']) $parts[] = $item['sugar_level'] . ' Sugar';
        if ($item['temperature']) $parts[] = $item['temperature'];
        return $parts ? implode(' · ', $parts) : null;
    }

    // "2026-11-03 19:48:05" -> "2026-11-03T19:48:05"
    private static function isoTime(?string $dbTime): ?string {
        return $dbTime ? str_replace(' ', 'T', $dbTime) : null;
    }
}
