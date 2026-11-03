<?php
// An error the client should see: HTTP status, message, and extra headers such as Retry-After.
// ErrorHandler turns it into {"error": message}.
class ApiException extends Exception {
    public function __construct(public int $status, string $message, public array $headers = []) {
        parent::__construct($message);
    }
}
