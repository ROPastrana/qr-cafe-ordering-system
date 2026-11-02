<?php
header('Content-Type: application/json; charset=utf-8');
require 'auth.php';
$cashier = require_cashier();
require 'db.php';
require 'payment.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$orderId = is_array($body) ? filter_var($body['orderId'] ?? null, FILTER_VALIDATE_INT) : false;
if (!$orderId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing order id']);
    exit;
}

try {
    echo json_encode(settle_payment($pdo, $orderId, $cashier['id'], $body));
} catch (PayException $e) {
    http_response_code($e->status);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('pay.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Could not record the payment']);
}