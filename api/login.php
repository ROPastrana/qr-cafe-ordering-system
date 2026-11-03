<?php
require __DIR__ . '/src/bootstrap.php';

Request::requireMethod('POST');
Session::requireCsrf();
$pdo = Database::connection();
(new RateLimiter($pdo))->hit('login', 20, 600);

$body = Request::json(false);
$username = trim((string)($body['username'] ?? ''));
$password = (string)($body['password'] ?? '');
if ($username === '' || $password === '') throw new ApiException(400, 'Enter your username and password');

$cashier = (new LoginService($pdo))->attempt($username, $password);
Session::signIn($cashier['id'], $cashier['name']);

Response::json($cashier);
