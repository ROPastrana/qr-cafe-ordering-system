<?php
// Counts requests per IP address in tbl_rate_limit and answers 429 when there are too many.
final class RateLimiter {
    public function __construct(private PDO $pdo) {}

    // Allows $max requests per IP in each $windowSeconds window.
    // Uses REMOTE_ADDR only: X-Forwarded-For can be faked by anyone.
    public function hit(string $bucket, int $max, int $windowSeconds): void {
        $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');

        // One atomic statement: start a new window if the old one ended, otherwise count the hit
        $this->pdo->prepare(
            "INSERT INTO tbl_rate_limit (ip, bucket, hits, window_start) VALUES (?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE
                 hits = IF(window_start <= NOW() - INTERVAL ? SECOND, 1, hits + 1),
                 window_start = IF(window_start <= NOW() - INTERVAL ? SECOND, NOW(), window_start)"
        )->execute([$ip, $bucket, $windowSeconds, $windowSeconds]);

        $stmt = $this->pdo->prepare(
            "SELECT hits, TIMESTAMPDIFF(SECOND, NOW(), window_start + INTERVAL ? SECOND) AS wait
             FROM tbl_rate_limit WHERE ip = ? AND bucket = ?"
        );
        $stmt->execute([$windowSeconds, $ip, $bucket]);
        $row = $stmt->fetch();

        if ($row && (int)$row['hits'] > $max) {
            throw new ApiException(429, 'Too many requests. Please wait a few minutes and try again.',
                                   ['Retry-After' => max(1, (int)$row['wait'])]);
        }
    }
}
