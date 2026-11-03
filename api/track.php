<?php
// Public: the customer's phone follows an order with its secret tracking token
require __DIR__ . '/src/bootstrap.php';

Request::requireMethod('GET');

$token = Request::query('t');
if (!preg_match('/^[a-f0-9]{32}$/', $token)) throw new ApiException(400, 'Invalid tracking code');

$order = (new OrderRepository(Database::connection()))->tracking($token);
if (!$order) throw new ApiException(404, 'Order not found');

Response::json($order);
