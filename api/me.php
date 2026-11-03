<?php
header('Content-Type: application/json; charset=utf-8');
require 'auth.php';

$cashier = require_cashier();
echo json_encode($cashier);