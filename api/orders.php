<?php
// Public: a customer places an order from their phone
require __DIR__ . '/src/bootstrap.php';
ErrorHandler::serverErrorMessage('Could not save your order. Please try again.');

Request::requireMethod('POST');
Session::requireCsrf();
$pdo = Database::connection();
(new RateLimiter($pdo))->hit('order', 60, 600);   // generous: a whole cafe may share one Wi-Fi IP

$body = Request::json();
$name = trim((string)($body['name'] ?? ''));
if ($name === '' || mb_strlen($name) > 100) throw new ApiException(400, 'Please enter a name (up to 100 characters)');
$serviceType = OrderService::serviceType($body['orderType'] ?? '');

$order = (new OrderService($pdo))->placeSelfOrder($name, $serviceType, $body['items'] ?? null);
Response::json($order, 201);
