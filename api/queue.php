<?php
// Cashier: open orders plus today's completed / declined ones
require __DIR__ . '/src/bootstrap.php';

Session::requireCashier();

Response::json((new OrderRepository(Database::connection()))->queue());
