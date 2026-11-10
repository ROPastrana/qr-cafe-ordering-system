<?php
// Run after every mysqldump, before committing:  php database\strip-password-hashes.php
// The repository is public, so cafe_pos.sql must never contain a real password hash.
// Accounts imported from the cleaned file can't sign in until a password is set (see README.md).
$file = __DIR__ . '/cafe_pos.sql';
$sql = file_get_contents($file);
if ($sql === false) exit("Could not read $file\n");

// Orders hold customer names and discount ID numbers, so their rows are removed too (tables stay).
$patterns = ['/\$2[aby]\$\d{2}\$[.\/A-Za-z0-9]{53}/', '/^INSERT INTO `tbl_(orders|order_items|customers|transactions|rate_limit)` .*\R/m'];
$clean = preg_replace($patterns, ['!set-a-password-after-import', ''], $sql, -1, $count);
if ($clean === null || file_put_contents($file, $clean) === false) exit("Could not clean $file\n");

echo "Removed $count password hash(es) and order data statement(s) from cafe_pos.sql\n";
