<?php
const CSRF_ENFORCED = true;           // set to false only while debugging with curl
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

function csrf_token(): string {
    start_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Call on every POST/PATCH. Other sites can make the browser send our cookie,
// but they cannot read the token from csrf.php, so they cannot send this header.
function require_csrf(): void {
    if (!CSRF_ENFORCED) return;
    start_session();
    $sent = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    $expected = (string)($_SESSION['csrf_token'] ?? '');
    if ($expected === '' || !hash_equals($expected, $sent)) {
        json_error(403, 'Security check failed. Please reload the page and try again.');
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
