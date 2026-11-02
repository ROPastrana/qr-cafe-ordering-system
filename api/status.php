<?php
header('Content-Type: application/json; charset=utf-8');
require 'db.php';

function fail(int $code, string $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') fail(405, 'Method not allowed');

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) fail(400, 'Invalid request');

$id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
if (!$id) fail(400, 'Missing order id');

// target (cashier screen name) => [database status, status the order must be in now]
$moves = [
    'preparing' => ['preparing', 'pending'],   // TEMPORARY: moves to the payment endpoint later
    'ready'     => ['ready',     'preparing'],
    'completed' => ['completed', 'ready'],
    'declined'  => ['declined',  'pending'],
];
$target = $body['status'] ?? '';
if (!isset($moves[$target])) fail(400, 'Invalid status');
[$newStatus, $mustBe] = $moves[$target];

$reason = null;
$note = null;
if ($target === 'declined') {
    $reason = $body['reason'] ?? '';
    if (!in_array($reason, ['Out of Stock', 'Kitchen Closing', 'Other'], true)) {
        fail(400, 'Invalid decline reason');
    }
    $note = trim((string)($body['note'] ?? ''));
    if (mb_strlen($note) > 255) fail(400, 'Note is too long (255 characters max)');
    if ($note === '') $note = null;
}

try {
    $stmt = $pdo->prepare(
        "UPDATE tbl_orders
         SET order_status = ?, decline_reason = ?, decline_note = ?
         WHERE order_id = ? AND order_status = ?"
    );
    $stmt->execute([$newStatus, $reason, $note, $id, $mustBe]);

    if ($stmt->rowCount() === 0) {
        $cur = $pdo->prepare("SELECT order_status FROM tbl_orders WHERE order_id = ?");
        $cur->execute([$id]);
        $row = $cur->fetch();
        if (!$row) fail(404, 'Order not found');
        fail(409, 'This order is already ' . $row['order_status'] . '. Refresh the queue.');
    }
} catch (PDOException $e) {
    error_log('status.php: ' . $e->getMessage());
    fail(500, 'Could not update the order');
}

echo json_encode(['ok' => true, 'status' => $target]);