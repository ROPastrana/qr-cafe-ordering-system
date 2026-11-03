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

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 5;

$stmt = $pdo->prepare(
    "SELECT cashier_id, full_name, password_hash,
            TIMESTAMPDIFF(SECOND, NOW(), locked_until) AS lock_left
     FROM tbl_cashiers WHERE username = ?"
);
$stmt->execute([$username]);
$row = $stmt->fetch();

// Checked before the password, so a locked account refuses even the right one
if ($row && (int)$row['lock_left'] > 0) {
    header('Retry-After: ' . (int)$row['lock_left']);
    fail(429, 'Too many wrong passwords. Try again in ' . LOCK_MINUTES . ' minutes.');
}

if (!$row || !password_verify($password, $row['password_hash'])) {
    if ($row) {
        // locked_until is set first: MariaDB applies SET assignments left to right
        $pdo->prepare(
            "UPDATE tbl_cashiers
             SET locked_until = IF(failed_attempts + 1 >= ?, NOW() + INTERVAL ? MINUTE, NULL),
                 failed_attempts = IF(failed_attempts + 1 >= ?, 0, failed_attempts + 1)
             WHERE cashier_id = ?"
        )->execute([MAX_FAILED_LOGINS, LOCK_MINUTES, MAX_FAILED_LOGINS, $row['cashier_id']]);
    }
    usleep(500000); // half-second delay slows down password guessing
    fail(401, 'Wrong username or password');
}

$pdo->prepare("UPDATE tbl_cashiers SET failed_attempts = 0, locked_until = NULL WHERE cashier_id = ?")
    ->execute([$row['cashier_id']]);

start_session();
session_regenerate_id(true);
$_SESSION['cashier_id']   = (int)$row['cashier_id'];
$_SESSION['cashier_name'] = $row['full_name'];
$_SESSION['login_at']     = time();

echo json_encode(['id' => (int)$row['cashier_id'], 'name' => $row['full_name']]);