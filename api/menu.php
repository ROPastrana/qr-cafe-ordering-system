<?php
require __DIR__ . '/src/bootstrap.php';

Request::requireMethod('GET');

Response::json((new MenuRepository(Database::connection()))->available());
