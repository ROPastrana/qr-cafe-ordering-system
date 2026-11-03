<?php
// Public: the e-receipt page (receipt/index.html) loads a paid order with its secret receipt token
require __DIR__ . '/src/bootstrap.php';

Request::requireMethod('GET');

$token = Request::query('t');
if (!preg_match('/^[a-f0-9]{32}$/', $token)) throw new ApiException(400, 'Invalid receipt link');

$receipt = (new OrderRepository(Database::connection()))->receipt($token);
if (!$receipt) throw new ApiException(404, 'Receipt not found');

Response::json($receipt);
