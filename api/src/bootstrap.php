<?php
// Every endpoint starts with:  require __DIR__ . '/src/bootstrap.php';
// Classes are loaded from this folder the first time they are used (OrderService -> src/OrderService.php),
// and any uncaught exception becomes a JSON error response.

// PHP warnings go to the error log only. XAMPP ships with display_errors=On, which would print
// warnings (with full file paths such as C:\xampp\htdocs\cafe\api\...) into the JSON responses.
ini_set('display_errors', '0');
ini_set('log_errors', '1');

spl_autoload_register(function (string $class): void {
    $file = __DIR__ . '/' . $class . '.php';
    if (is_file($file)) require $file;
});

ErrorHandler::register();
