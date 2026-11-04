<?php
// Cashier: open orders plus today's completed / declined ones
require __DIR__ . '/src/bootstrap.php';

// ?poll=1: the queue page refreshing itself, which doesn't count as the cashier being active
Session::requireCashier(Request::query('poll') !== '1');
Request::requireMethod('GET');

Response::json((new OrderRepository(Database::connection()))->queue());
