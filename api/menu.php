<?php
require __DIR__ . '/src/bootstrap.php';

Response::json((new MenuRepository(Database::connection()))->available());
