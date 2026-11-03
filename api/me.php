<?php
require __DIR__ . '/src/bootstrap.php';

$cashier = Session::requireCashier();

Response::json($cashier);
