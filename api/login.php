<?php
header('Content-Type: application/json; charset=utf-8');
require 'db.php';
require 'auth.php';

function fail(int $code, string $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Method not allowed');
require_csrf();
rate_limit($pdo, 'login', 20, 600);

$body = json_decode(file_get_contents('php://input'), true);
$username = trim((string)($body['username'] ?? ''));
$password = (string)($body['password'] ?? '');
if ($username === '' || $password === '') fail(400, 'Enter your username and password');

$stmt = $pdo->prepare("SELECT cashier_id, full_name, password_hash FROM tbl_cashiers WHERE username = ?");
$stmt->execute([$username]);
$row = $stmt->fetch();

if (!$row || !password_verify($password, $row['password_hash'])) {
    usleep(500000); // half-second delay slows down password guessing
    fail(401, 'Wrong username or password');
}

start_session();
session_regenerate_id(true);
$_SESSION['cashier_id']   = (int)$row['cashier_id'];
$_SESSION['cashier_name'] = $row['full_name'];
$_SESSION['login_at']     = time();

echo json_encode(['id' => (int)$row['cashier_id'], 'name' => $row['full_name']]);