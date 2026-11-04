<?php
// Copy this file to db.php and fill in your MySQL login. db.php is git-ignored.
// Use the limited cafe_app account from database/create_app_user.sql, not root.
$host = 'localhost';
$dbname = 'cafe_pos';
$user = 'cafe_app';
$pass = 'the_password_you_set_in_create_app_user.sql';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
