<?php
require __DIR__ . '/src/bootstrap.php';

Request::requireMethod('POST');
Session::requireCsrf();

Session::signOut();
Response::json(['ok' => true]);
