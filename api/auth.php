<?php
const SESSION_MAX_AGE = 12 * 60 * 60; // cashiers must sign in again after 12 hours

function json_error(int $status, string $message): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $message]);
    exit;
}

function start_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_name('cafe_session');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function require_cashier(): array {
    start_session();
    if (empty($_SESSION['cashier_id'])) json_error(401, 'Please sign in');

    $loginAt = (int)($_SESSION['login_at'] ?? 0);
    if (time() - $loginAt > SESSION_MAX_AGE) {
        unset($_SESSION['cashier_id'], $_SESSION['cashier_name'], $_SESSION['login_at']);
        json_error(401, 'Your session expired. Please sign in again.');
    }
    return ['id' => (int)$_SESSION['cashier_id'], 'name' => (string)$_SESSION['cashier_name']];
}
