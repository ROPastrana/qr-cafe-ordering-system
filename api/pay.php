<?php
// Cashier: settle a customer's order (cash or GCash, optional discount)
require __DIR__ . '/src/bootstrap.php';
ErrorHandler::serverErrorMessage('Could not record the payment');

$cashier = Session::requireCashier();
Request::requireMethod('POST');
Session::requireCsrf();

$body = Request::json(false);
$orderId = filter_var($body['orderId'] ?? null, FILTER_VALIDATE_INT);
if (!$orderId) throw new ApiException(400, 'Missing order id');

Response::json((new PaymentService(Database::connection()))->settle($orderId, $cashier['id'], $body));
