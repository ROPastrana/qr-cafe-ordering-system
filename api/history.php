<?php
header('Content-Type: application/json; charset=utf-8');
require 'auth.php';
require_cashier();
require 'db.php';
require 'queue_lib.php';

function fail(int $code, string $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail(405, 'Method not allowed');

function valid_date(string $d): bool {
    return preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $d, $m) && checkdate((int)$m[2], (int)$m[3], (int)$m[1]);
}

$from = (string)($_GET['from'] ?? date('Y-m-d'));
$to   = (string)($_GET['to']   ?? date('Y-m-d'));
if (!valid_date($from) || !valid_date($to)) fail(400, 'Invalid date');
if ($from > $to) fail(400, 'The start date is after the end date');
if ((strtotime($to) - strtotime($from)) > 366 * 86400) fail(400, 'Choose a range of one year or less');

// completed = for the sales report; finished = completed and declined, for order history
$statuses = ($_GET['status'] ?? 'finished') === 'completed' ? ['completed'] : ['completed', 'declined'];
$marks = implode(',', array_fill(0, count($statuses), '?'));

echo json_encode(
    fetch_orders(
        $pdo,
        "o.order_status IN ($marks) AND DATE(o.created_at) BETWEEN ? AND ?",
        [...$statuses, $from, $to],
        'o.created_at DESC'
    ),
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);