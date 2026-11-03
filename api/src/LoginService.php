<?php
// Checks a cashier's password and locks the account after too many wrong ones.
final class LoginService {
    private const MAX_FAILED_LOGINS = 5;
    private const LOCK_MINUTES = 5;

    public function __construct(private PDO $pdo) {}

    // Returns ['id' => ..., 'name' => ...] or throws 401 (wrong login) / 429 (locked)
    public function attempt(string $username, string $password): array {
        $stmt = $this->pdo->prepare(
            "SELECT cashier_id, full_name, password_hash,
                    TIMESTAMPDIFF(SECOND, NOW(), locked_until) AS lock_left
             FROM tbl_cashiers WHERE username = ?"
        );
        $stmt->execute([$username]);
        $row = $stmt->fetch();

        // Checked before the password, so a locked account refuses even the right one
        if ($row && (int)$row['lock_left'] > 0) {
            throw new ApiException(429, 'Too many wrong passwords. Try again in ' . self::LOCK_MINUTES . ' minutes.',
                                   ['Retry-After' => (int)$row['lock_left']]);
        }

        if (!$row || !password_verify($password, $row['password_hash'])) {
            if ($row) $this->recordFailure((int)$row['cashier_id']);
            usleep(500000); // half-second delay slows down password guessing
            throw new ApiException(401, 'Wrong username or password');   // same message for both cases
        }

        $this->pdo->prepare("UPDATE tbl_cashiers SET failed_attempts = 0, locked_until = NULL WHERE cashier_id = ?")
            ->execute([$row['cashier_id']]);
        return ['id' => (int)$row['cashier_id'], 'name' => $row['full_name']];
    }

    // The 5th failure locks the account and resets the counter
    private function recordFailure(int $cashierId): void {
        // locked_until is set first: MariaDB applies SET assignments left to right
        $this->pdo->prepare(
            "UPDATE tbl_cashiers
             SET locked_until = IF(failed_attempts + 1 >= ?, NOW() + INTERVAL ? MINUTE, NULL),
                 failed_attempts = IF(failed_attempts + 1 >= ?, 0, failed_attempts + 1)
             WHERE cashier_id = ?"
        )->execute([self::MAX_FAILED_LOGINS, self::LOCK_MINUTES, self::MAX_FAILED_LOGINS, $cashierId]);
    }
}
