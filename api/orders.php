<?php
// Public: a customer places an order from their phone
require __DIR__ . '/src/bootstrap.php';
ErrorHandler::serverErrorMessage('Could not save your order. Please try again.');

Request::requireMethod('POST');
Session::requireCsrf();
$pdo = Database::connection();
(new RateLimiter($pdo))->hit('order', 60, 600);   // generous: a whole cafe may share one Wi-Fi IP

$body = Request::json();

// Optional: the cart page sends the same requestId when it retries, so a retry never makes a second order.
// The D flag makes $ the real end of the string (otherwise a trailing newline would pass).
$requestId = $body['requestId'] ?? null;
if ($requestId !== null && (!is_string($requestId) || !preg_match('/^[A-Za-z0-9-]{16,36}$/D', $requestId))) {
    throw new ApiException(400, 'Invalid request id');
}

$name = trim((string)($body['name'] ?? ''));
if ($name === '' || mb_strlen($name) > 100) throw new ApiException(400, 'Please enter a name (up to 100 characters)');
$serviceType = OrderService::serviceType($body['orderType'] ?? '');

// 201 for a new order; 200 with the same answer when this requestId already made one
[$order, $created] = (new OrderService($pdo))->placeSelfOrder($name, $serviceType, $body['items'] ?? null, $requestId);
Response::json($order, $created ? 201 : 200);
