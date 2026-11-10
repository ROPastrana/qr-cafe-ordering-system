<?php
// Cashier: ready / completed / declined (pending -> preparing happens only in pay.php)
require __DIR__ . '/src/bootstrap.php';
ErrorHandler::serverErrorMessage('Could not update the order');

Session::requireCashier();
Request::requireMethod('PATCH');
Session::requireCsrf();

$body = Request::json();
$id = Request::intValue($body['id'] ?? null);
if (!$id) throw new ApiException(400, 'Missing order id');

(new OrderService(Database::connection()))
    ->changeStatus($id, $body['status'] ?? '', $body['reason'] ?? '', Request::text($body, 'note'));

Response::json(['ok' => true, 'status' => $body['status']]);
