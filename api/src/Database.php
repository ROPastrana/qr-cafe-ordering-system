<?php
final class Database {
    private static ?PDO $pdo = null;

    // One PDO connection per request, made on first use from the login in api/db.php
    public static function connection(): PDO {
        if (self::$pdo === null) {
            require __DIR__ . '/../db.php';   // defines $pdo
            self::$pdo = $pdo;
        }
        return self::$pdo;
    }
}
