<?php
header('Content-Type: application/json; charset=utf-8');
require 'auth.php';
require_cashier();
require 'db.php';
require 'queue_lib.php';

// Active orders always, plus anything from today (completed / declined)
echo json_encode(
    fetch_orders($pdo, "o.order_status IN ('pending','preparing','ready') OR DATE(o.created_at) = CURDATE()", []),
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
