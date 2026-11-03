<?php
header('Content-Type: application/json');
require 'db.php';
require 'order_lib.php';

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

$serviceType = ['Dine In' => 'dine_in', 'Take Out' => 'take_out'][$body['orderType'] ?? ''] ?? null;
if (!$serviceType) fail(400, 'Invalid order type');

try {
    $pdo->beginTransaction();
    $cart = price_cart($pdo, $body['items'] ?? null);
    [, $code, $trackToken] = create_order($pdo, $name, 'self_order', $serviceType, null, $cart);
    $pdo->commit();
} catch (ApiException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail($e->status, $e->getMessage());
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('orders.php: ' . $e->getMessage());
    fail(500, 'Could not save your order. Please try again.');
}

http_response_code(201);
echo json_encode(['orderCode' => $code, 'total' => $cart['subtotal'], 'trackToken' => $trackToken]);