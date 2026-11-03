<?php
// Every endpoint starts with:  require __DIR__ . '/src/bootstrap.php';
// Classes are loaded from this folder the first time they are used (OrderService -> src/OrderService.php),
// and any uncaught exception becomes a JSON error response.
spl_autoload_register(function (string $class): void {
    $file = __DIR__ . '/' . $class . '.php';
    if (is_file($file)) require $file;
});

ErrorHandler::register();
