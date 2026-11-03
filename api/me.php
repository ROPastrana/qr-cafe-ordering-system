<?php
require __DIR__ . '/src/bootstrap.php';

$cashier = Session::requireCashier();
Request::requireMethod('GET');

Response::json($cashier);
