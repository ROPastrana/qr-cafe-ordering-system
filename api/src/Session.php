<?php
// The PHP session: cookie settings, CSRF token, and which cashier is signed in.
final class Session {
    private const CSRF_ENFORCED = true;      // set to false only while debugging with curl
    private const MAX_AGE = 12 * 60 * 60;    // cashiers must sign in again after 12 hours

    public static function start(): void {
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

    public static function csrfToken(): string {
        self::start();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    // Call on every POST/PATCH. Other sites can make the browser send our cookie,
    // but they cannot read the token from csrf.php, so they cannot send this header.
    public static function requireCsrf(): void {
        if (!self::CSRF_ENFORCED) return;
        self::start();
        $sent = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        $expected = (string)($_SESSION['csrf_token'] ?? '');
        if ($expected === '' || !hash_equals($expected, $sent)) {
            throw new ApiException(403, 'Security check failed. Please reload the page and try again.');
        }
    }

    // The signed-in cashier as ['id' => ..., 'name' => ...], or a 401
    public static function requireCashier(): array {
        self::start();
        if (empty($_SESSION['cashier_id'])) throw new ApiException(401, 'Please sign in');

        $loginAt = (int)($_SESSION['login_at'] ?? 0);
        if (time() - $loginAt > self::MAX_AGE) {
            unset($_SESSION['cashier_id'], $_SESSION['cashier_name'], $_SESSION['login_at']);
            throw new ApiException(401, 'Your session expired. Please sign in again.');
        }
        return ['id' => (int)$_SESSION['cashier_id'], 'name' => (string)$_SESSION['cashier_name']];
    }

    // A new session id at sign-in stops session fixation; the CSRF token is kept
    public static function signIn(int $cashierId, string $name): void {
        self::start();
        session_regenerate_id(true);
        $_SESSION['cashier_id']   = $cashierId;
        $_SESSION['cashier_name'] = $name;
        $_SESSION['login_at']     = time();
    }

    public static function signOut(): void {
        self::start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }
}
