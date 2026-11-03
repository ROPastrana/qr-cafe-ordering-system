<?php
// Cashier: open orders plus today's completed / declined ones
require __DIR__ . '/src/bootstrap.php';

Session::requireCashier();
Request::requireMethod('GET');

Response::json((new OrderRepository(Database::connection()))->queue());
