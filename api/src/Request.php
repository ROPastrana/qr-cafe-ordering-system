<?php
final class Request {
    public static function requireMethod(string $method): void {
        if ($_SERVER['REQUEST_METHOD'] !== $method) throw new ApiException(405, 'Method not allowed');
    }

    // The JSON body as an array. Not JSON: 400, or an empty array when $required is false
    // (the endpoint then reports the missing field itself).
    public static function json(bool $required = true): array {
        $body = json_decode(file_get_contents('php://input'), true);
        if (is_array($body)) return $body;
        if ($required) throw new ApiException(400, 'Invalid request');
        return [];
    }

    public static function query(string $name, string $default = ''): string {
        return (string)($_GET[$name] ?? $default);
    }
}
