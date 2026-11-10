<?php
// Counts events per IP address in tbl_rate_limit and answers 429 when there are too many.
// Uses REMOTE_ADDR only: X-Forwarded-For can be faked by anyone.
final class RateLimiter {
    public function __construct(private PDO $pdo) {}

    // Counts this request and allows $max requests per IP in each $windowSeconds window.
    // Counting comes first, so requests sent at the same moment can't all slip under the limit.
    public function hit(string $bucket, int $max, int $windowSeconds,
                        string $message = 'Too many requests. Please wait a few minutes and try again.'): void {
        $this->record($bucket, $windowSeconds);
        [$hits, $wait] = $this->current($bucket, $windowSeconds);
        if ($hits > $max) throw new ApiException(429, $message, ['Retry-After' => max(1, $wait)]);
    }

    // Forgets this IP's events in the bucket (UPDATE, so the database user needs no DELETE right)
    public function clear(string $bucket): void {
        $this->pdo->prepare("UPDATE tbl_rate_limit SET hits = 0 WHERE ip = ? AND bucket = ?")
            ->execute([self::ip(), $bucket]);
    }

    // Counts one event. One atomic statement: starts a new window if the old one ended.
    private function record(string $bucket, int $windowSeconds): void {
        $this->pdo->prepare(
            "INSERT INTO tbl_rate_limit (ip, bucket, hits, window_start) VALUES (?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE
                 hits = IF(window_start <= NOW() - INTERVAL ? SECOND, 1, hits + 1),
                 window_start = IF(window_start <= NOW() - INTERVAL ? SECOND, NOW(), window_start)"
        )->execute([self::ip(), $bucket, $windowSeconds, $windowSeconds]);
    }

    // [events in the current window, seconds until it ends]; [0, 0] when the window is over
    private function current(string $bucket, int $windowSeconds): array {
        $stmt = $this->pdo->prepare(
            "SELECT hits, TIMESTAMPDIFF(SECOND, NOW(), window_start + INTERVAL ? SECOND) AS wait
             FROM tbl_rate_limit WHERE ip = ? AND bucket = ?"
        );
        $stmt->execute([$windowSeconds, self::ip(), $bucket]);
        $row = $stmt->fetch();
        if (!$row || (int)$row['wait'] <= 0) return [0, 0];
        return [(int)$row['hits'], (int)$row['wait']];
    }

    private static function ip(): string {
        return (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    }
}
