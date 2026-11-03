<?php
header('Content-Type: application/json; charset=utf-8');
require 'auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error(405, 'Method not allowed');

echo json_encode(['token' => csrf_token()]);
