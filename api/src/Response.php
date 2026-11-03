<?php
final class Response {
    // Sends $data as JSON and ends the request
    public static function json(mixed $data, int $status = 200, array $headers = []): never {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        foreach ($headers as $name => $value) header($name . ': ' . $value);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(int $status, string $message, array $headers = []): never {
        self::json(['error' => $message], $status, $headers);
    }
}
