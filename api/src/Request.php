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

    // A whole number from the JSON body, or false. PHP's filter alone would read true as 1.
    public static function intValue(mixed $value): int|false {
        return is_bool($value) ? false : filter_var($value, FILTER_VALIDATE_INT);
    }

    // A query-string value. ?t[]=x sends an array instead of text; that counts as missing,
    // so it never reaches a (string) cast (which would raise an "Array to string" warning).
    public static function query(string $name, string $default = ''): string {
        $value = $_GET[$name] ?? $default;
        return is_string($value) ? $value : $default;
    }

    // A text field from the JSON body: '' when missing or null, 400 when it is not text
    // (for example {"name": ["x"]} or {"name": 5}).
    public static function text(array $body, string $key): string {
        $value = $body[$key] ?? '';
        if (!is_string($value)) throw new ApiException(400, 'Invalid request');
        return $value;
    }
}
