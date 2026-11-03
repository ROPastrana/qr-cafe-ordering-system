<?php
require __DIR__ . '/src/bootstrap.php';

Request::requireMethod('GET');

Response::json(['token' => Session::csrfToken()]);
