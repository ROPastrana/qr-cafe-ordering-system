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
if (!preg_match('/^[a-f0-9]{32}$/', $token)) fail(400, 'Invalid tracking code');

$stmt = $pdo->prepare(
    "SELECT order_code, order_status, decline_reason, decline_note
     FROM tbl_orders WHERE track_token = ?"
);
$stmt->execute([$token]);
$row = $stmt->fetch();
if (!$row) fail(404, 'Order not found');

echo json_encode([
    'code'          => $row['order_code'],
    'status'        => $row['order_status'],   // pending | preparing | ready | completed | declined
    'declineReason' => $row['decline_reason'],
    'declineNote'   => $row['decline_note'],
]);