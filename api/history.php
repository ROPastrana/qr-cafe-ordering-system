<?php
// Cashier: finished orders in a date range (order history and the sales report)
require __DIR__ . '/src/bootstrap.php';

Session::requireCashier();
Request::requireMethod('GET');

function valid_date(string $d): bool {
    return preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $d, $m) && checkdate((int)$m[2], (int)$m[3], (int)$m[1]);
}

$from = Request::query('from', date('Y-m-d'));
$to   = Request::query('to', date('Y-m-d'));
if (!valid_date($from) || !valid_date($to)) throw new ApiException(400, 'Invalid date');
if ($from > $to) throw new ApiException(400, 'The start date is after the end date');
if ((strtotime($to) - strtotime($from)) > 366 * 86400) throw new ApiException(400, 'Choose a range of one year or less');

// status=completed: the sales report; anything else: completed and declined, for order history
$completedOnly = Request::query('status', 'finished') === 'completed';

Response::json((new OrderRepository(Database::connection()))->history($from, $to, $completedOnly));
