-- Creates the MySQL account the PHP API uses, with only the rights it needs:
-- it can read, add and change rows in cafe_pos, but it cannot delete rows, drop or alter
-- tables, or touch any other database. If someone ever found a way to run their own SQL
-- through the API, this limits the damage.
--
-- 1. Import cafe_pos.sql first.
-- 2. Replace CHANGE-ME below with a long random password (keep the quotes).
-- 3. Run this file as root, for example:
--      C:\xampp\mysql\bin\mysql.exe -u root < C:\xampp\htdocs\cafe\database\create_app_user.sql
-- 4. Put cafe_app and the same password in api/db.php.
--
-- Don't commit the real password: change it back to CHANGE-ME before committing this file.

CREATE USER IF NOT EXISTS 'cafe_app'@'localhost' IDENTIFIED BY 'CHANGE-ME';
GRANT SELECT, INSERT, UPDATE ON cafe_pos.* TO 'cafe_app'@'localhost';
FLUSH PRIVILEGES;
