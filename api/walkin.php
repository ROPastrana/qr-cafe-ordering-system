<?php
// Cashier: a walk-in order and its payment in one step
require __DIR__ . '/src/bootstrap.php';
ErrorHandler::serverErrorMessage('Could not save the order');

$cashier = Session::requireCashier();
Request::requireMethod('POST');
Session::requireCsrf();

$body = Request::json();
$name = trim(Request::text($body, 'name'));
if (mb_strlen($name) > 100) throw new ApiException(400, 'Name is too long (100 characters max)');
$serviceType = OrderService::serviceType($body['orderType'] ?? '');

$receipt = (new OrderService(Database::connection()))
    ->placeWalkIn($name === '' ? null : $name, $serviceType, $cashier['id'], $body);
Response::json($receipt, 201);
