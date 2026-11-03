<?php
// One place that turns exceptions into JSON errors, so endpoints don't need try/catch blocks.
final class ErrorHandler {
    private static string $serverError = 'Something went wrong. Please try again.';

    public static function register(): void {
        set_exception_handler([self::class, 'handle']);
    }

    // What the user sees when something unexpected fails; the details go to the PHP error log
    public static function serverErrorMessage(string $message): void {
        self::$serverError = $message;
    }

    public static function handle(Throwable $e): void {
        if ($e instanceof ApiException) Response::error($e->status, $e->getMessage(), $e->headers);

        error_log(basename($_SERVER['SCRIPT_NAME']) . ': ' . $e->getMessage());
        Response::error(500, self::$serverError);
    }
}
