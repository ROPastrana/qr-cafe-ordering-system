<?php
// The PHP session: cookie settings, CSRF token, and which cashier is signed in.
final class Session {
    private const CSRF_ENFORCED = true;      // set to false only while debugging with curl
    private const MAX_AGE = 12 * 60 * 60;    // cashiers must sign in again after 12 hours, even when active
    private const IDLE_LIMIT = 30 * 60;      // ... or after 30 minutes without doing anything

    // The cookie is only sent to this app, not to every site on the same server
    // (phpMyAdmin and other projects in htdocs). The apps always live under /cafe/.
    private const COOKIE_PATH = '/cafe/';
    // A new name, so an old cookie with path "/" from before this change is simply ignored
    private const COOKIE_NAME = 'cafe_sid';

    public static function start(): void {
        if (session_status() === PHP_SESSION_NONE) {
            // Refuse session ids the server never created (a planted cookie gets a fresh id instead)
            ini_set('session.use_strict_mode', '1');
            ini_set('session.use_only_cookies', '1');
            session_name(self::COOKIE_NAME);
            session_set_cookie_params([
                'lifetime' => 0,
                'path'     => self::COOKIE_PATH,
                // Over HTTPS the cookie is marked Secure, so the browser never sends it over plain HTTP.
                // On plain HTTP (the XAMPP default) it can't be, or sign-in would stop working.
                'secure'   => self::isHttps(),
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
            session_start();
        }
    }

    public static function isHttps(): bool {
        return !empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off';
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

    // The signed-in cashier as ['id' => ..., 'name' => ...], or a 401.
    // $isActivity: false for automatic background requests (the queue refreshing itself every
    // 15 seconds), so a screen nobody is using still signs out after IDLE_LIMIT.
    public static function requireCashier(bool $isActivity = true): array {
        self::start();
        if (empty($_SESSION['cashier_id'])) throw new ApiException(401, 'Please sign in');

        $now = time();
        if ($now - (int)($_SESSION['login_at'] ?? 0) > self::MAX_AGE) {
            self::endSignIn('Your session expired. Please sign in again.');
        }
        if ($now - (int)($_SESSION['last_active'] ?? 0) > self::IDLE_LIMIT) {
            self::endSignIn('You were signed out after 30 minutes without activity. Please sign in again.');
        }

        // The account must still exist and have the same password. Deleting a cashier or
        // changing their password ends every session they already have.
        $stmt = Database::connection()->prepare("SELECT password_hash FROM tbl_cashiers WHERE cashier_id = ?");
        $stmt->execute([(int)$_SESSION['cashier_id']]);
        $hash = $stmt->fetchColumn();
        if ($hash === false || !hash_equals((string)($_SESSION['password_tag'] ?? ''), self::passwordTag($hash))) {
            self::endSignIn('Please sign in again.');
        }

        if ($isActivity) $_SESSION['last_active'] = $now;
        return ['id' => (int)$_SESSION['cashier_id'], 'name' => (string)$_SESSION['cashier_name']];
    }

    // A new session id at sign-in stops session fixation; the CSRF token is kept.
    // $passwordHash is the stored bcrypt hash; only a fingerprint of it is kept in the session.
    public static function signIn(int $cashierId, string $name, string $passwordHash): void {
        self::start();
        session_regenerate_id(true);
        $now = time();
        $_SESSION['cashier_id']   = $cashierId;
        $_SESSION['cashier_name'] = $name;
        $_SESSION['login_at']     = $now;
        $_SESSION['last_active']  = $now;
        $_SESSION['password_tag'] = self::passwordTag($passwordHash);
    }

    public static function signOut(): void {
        self::start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires'  => time() - 3600,
                'path'     => $p['path'],
                'domain'   => $p['domain'],
                'secure'   => $p['secure'],
                'httponly' => $p['httponly'],
                'samesite' => $p['samesite'],
            ]);
        }
        session_destroy();
    }

    // Signs the cashier out of this session (the CSRF token stays) and answers 401
    private static function endSignIn(string $message): never {
        unset($_SESSION['cashier_id'], $_SESSION['cashier_name'], $_SESSION['login_at'],
              $_SESSION['last_active'], $_SESSION['password_tag']);
        throw new ApiException(401, $message);
    }

    // Changes whenever the password changes (every new bcrypt hash has a new salt)
    private static function passwordTag(string $hash): string {
        return hash('sha256', $hash);
    }
}
