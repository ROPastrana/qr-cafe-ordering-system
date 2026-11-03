<?php
header('Content-Type: application/json; charset=utf-8');
require 'auth.php';
$cashier = require_cashier();
require 'db.php';
require 'order_lib.php';
require 'payment.php';

function fail(int $code, string $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Method not allowed');
require_csrf();

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) fail(400, 'Invalid request');

$name = trim((string)($body['name'] ?? ''));
if (mb_strlen($name) > 100) fail(400, 'Name is too long (100 characters max)');

$serviceType = ['Dine In' => 'dine_in', 'Take Out' => 'take_out'][$body['orderType'] ?? ''] ?? null;
if (!$serviceType) fail(400, 'Invalid order type');

try {
    // Order and payment succeed together or not at all
    $pdo->beginTransaction();
    $cart = price_cart($pdo, $body['items'] ?? null);
    [$orderId] = create_order($pdo, $name === '' ? null : $name, 'walk_in',
                              $serviceType, $cashier['id'], $cart);
    $receipt = settle_payment($pdo, $orderId, $cashier['id'], $body);
    $pdo->commit();
    http_response_code(201);
    echo json_encode($receipt);
} catch (ApiException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail($e->status, $e->getMessage());
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('walkin.php: ' . $e->getMessage());
    fail(500, 'Could not save the order');
}