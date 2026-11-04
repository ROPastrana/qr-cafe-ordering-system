<?php
// Checks a cashier's password and slows down password guessing.
//
// Two limits:
//  1. Per username AND IP address: 5 wrong passwords lock that username for 5 minutes, but only
//     for the device that is guessing. A customer on the cafe Wi-Fi can no longer lock the real
//     cashier out, because the cashier signs in from a different IP address.
//  2. Per account, from all IP addresses together: 50 wrong passwords lock the account for
//     15 minutes. This is a backstop against guessing from many devices at once.
final class LoginService {
    private const MAX_FAILS_PER_IP = 5;
    private const IP_LOCK_SECONDS = 5 * 60;
    private const MAX_FAILS_PER_ACCOUNT = 50;
    private const ACCOUNT_LOCK_MINUTES = 15;

    // Same text for both locks and for usernames that don't exist, so the message never shows
    // which usernames are real.
    private const LOCKED_MESSAGE = 'Too many wrong passwords. Please wait a few minutes and try again.';

    // bcrypt hash of a random password nobody knows, at the same cost (10) as the stored hashes.
    // It is checked when the username doesn't exist, so a wrong username takes as long as a
    // wrong password and response times don't reveal which usernames are real.
    private const DUMMY_HASH = '$2y$10$dG6eb.dFYK1.fey/tk.Ovu.M/03hQWLGgsZimKgqeTnG1TV/Kr9P2';

    public function __construct(private PDO $pdo, private RateLimiter $limiter) {}

    // Returns ['id', 'name', 'passwordHash'] or throws 401 (wrong login) / 429 (locked).
    // passwordHash is for Session::signIn() only; never send it to the browser.
    public function attempt(string $username, string $password): array {
        // Usernames are compared without case by MySQL, so the counter is too
        $bucket = 'login-fail:' . substr(hash('sha256', mb_strtolower($username)), 0, 19);   // fits bucket varchar(30)

        // Checked before the password, so a locked username refuses even the right one.
        // Works the same for usernames that don't exist.
        $this->limiter->check($bucket, self::MAX_FAILS_PER_IP, self::IP_LOCK_SECONDS, self::LOCKED_MESSAGE);

        $stmt = $this->pdo->prepare(
            "SELECT cashier_id, full_name, password_hash,
                    TIMESTAMPDIFF(SECOND, NOW(), locked_until) AS lock_left
             FROM tbl_cashiers WHERE username = ?"
        );
        $stmt->execute([$username]);
        $row = $stmt->fetch();

        if ($row && (int)$row['lock_left'] > 0) {
            throw new ApiException(429, self::LOCKED_MESSAGE, ['Retry-After' => (int)$row['lock_left']]);
        }

        // Always run one bcrypt check, even for an unknown username (see DUMMY_HASH)
        $ok = password_verify($password, $row ? $row['password_hash'] : self::DUMMY_HASH);
        if (!$row || !$ok) {
            $this->limiter->record($bucket, self::IP_LOCK_SECONDS);
            if ($row) $this->recordFailure((int)$row['cashier_id']);
            usleep(500000); // half-second delay slows down password guessing
            throw new ApiException(401, 'Wrong username or password');   // same message for both cases
        }

        $this->limiter->clear($bucket);
        $this->pdo->prepare("UPDATE tbl_cashiers SET failed_attempts = 0, locked_until = NULL WHERE cashier_id = ?")
            ->execute([$row['cashier_id']]);
        return ['id' => (int)$row['cashier_id'], 'name' => $row['full_name'], 'passwordHash' => $row['password_hash']];
    }

    // The 50th failure (from any IP addresses) locks the account and resets the counter
    private function recordFailure(int $cashierId): void {
        // locked_until is set first: MariaDB applies SET assignments left to right
        $this->pdo->prepare(
            "UPDATE tbl_cashiers
             SET locked_until = IF(failed_attempts + 1 >= ?, NOW() + INTERVAL ? MINUTE, NULL),
                 failed_attempts = IF(failed_attempts + 1 >= ?, 0, failed_attempts + 1)
             WHERE cashier_id = ?"
        )->execute([self::MAX_FAILS_PER_ACCOUNT, self::ACCOUNT_LOCK_MINUTES, self::MAX_FAILS_PER_ACCOUNT, $cashierId]);
    }
}
