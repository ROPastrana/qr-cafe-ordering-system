<?php
require __DIR__ . '/src/bootstrap.php';

Request::requireMethod('POST');
Session::requireCsrf();
$pdo = Database::connection();
$limiter = new RateLimiter($pdo);
$limiter->hit('login', 20, 600);

$body = Request::json(false);
$username = trim(Request::text($body, 'username'));
$password = Request::text($body, 'password');
if ($username === '' || $password === '') throw new ApiException(400, 'Enter your username and password');

$cashier = (new LoginService($pdo, $limiter))->attempt($username, $password);
Session::signIn($cashier['id'], $cashier['name'], $cashier['passwordHash']);

// Only the id and name: the password hash stays on the server
Response::json(['id' => $cashier['id'], 'name' => $cashier['name']]);
