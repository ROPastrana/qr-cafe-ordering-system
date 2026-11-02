<?php
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
    if (empty($_SESSION['cashier_id'])) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Please sign in']);
        exit;
    }
    return ['id' => (int)$_SESSION['cashier_id'], 'name' => (string)$_SESSION['cashier_name']];
}