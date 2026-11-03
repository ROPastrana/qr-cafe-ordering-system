<?php
class ApiException extends Exception {
    public function __construct(public int $status, string $message) {
        parent::__construct($message);
    }
}

class PayException extends ApiException {}