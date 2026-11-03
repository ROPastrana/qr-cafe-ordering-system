# Web-Based Self-Ordering and POS System with QR Code Menu Access for Café Operations

WMA4 project, Tarlac State University.

Customers scan a QR code, browse the menu on their phone, and place an order
without an account. The cashier sees the order on a POS dashboard, takes payment
(cash or GCash, with PWD / Senior Citizen / Student discounts), and moves it
through preparing → ready → completed. The customer's phone follows the order
live and shows an e-receipt once it is paid. Walk-in orders are entered at the POS.

## What is in this repository

| Folder | Contents |
| --- | --- |
| `api/` | PHP back end: one file per endpoint, plus shared helpers |
| `database/cafe_pos.sql` | MySQL / MariaDB export of the `cafe_pos` database |
| `qr-cafe-customer-html/qr-cafe/` | Customer pages (HTML + Tailwind CSS + JavaScript) |
| `qr-cafe-cashier-html/qr-cafe-cashier/` | Cashier / POS pages (HTML + Tailwind CSS + JavaScript) |
| `receipt/` | Stand-alone e-receipt page with a Code 39 barcode |

Stack: XAMPP (Apache, PHP 8.2, MariaDB 10.4), procedural PHP with PDO, plain
JavaScript. No framework and no build step is needed to run it.

## Setup (Windows + XAMPP)

1. Clone the repository into `C:\xampp\htdocs\cafe`.
2. Start **Apache** and **MySQL** in the XAMPP Control Panel.
3. Import the database (creates `cafe_pos`), either in phpMyAdmin
   (*Import* → `database/cafe_pos.sql`) or from a terminal:
   ```
   C:\xampp\mysql\bin\mysql.exe -u root < C:\xampp\htdocs\cafe\database\cafe_pos.sql
   ```
4. Copy `api/db.example.php` to `api/db.php` and enter your MySQL user and
   password. `db.php` is git-ignored; never commit it.
5. Open the apps:
   - Customer: `http://localhost/cafe/qr-cafe-customer-html/qr-cafe/`
   - Cashier: `http://localhost/cafe/qr-cafe-cashier-html/qr-cafe-cashier/`

**On a phone:** connect it to the same Wi-Fi as the laptop and replace
`localhost` with the laptop's IP address (shown by `ipconfig`, e.g.
`http://192.168.1.20/cafe/qr-cafe-customer-html/qr-cafe/`). The QR code on the
tables should point to that address. Windows Firewall may ask to allow Apache.

### Cashier accounts

Accounts live in `tbl_cashiers` (passwords are stored as bcrypt hashes). To set
a new password, create a hash and update the row:

```
C:\xampp\php\php.exe -r "echo password_hash('NEW-PASSWORD-HERE', PASSWORD_DEFAULT), PHP_EOL;"
```
```sql
UPDATE tbl_cashiers SET password_hash = '<paste the hash>' WHERE username = 'cashier01';
```

## How an order moves

```
customer places order ──► pending ──(cashier pays: pay.php)──► preparing ──► ready ──► completed
                             │
                             └──(cashier declines with a reason)──► declined
```

Walk-in orders are created and paid in one step (`walkin.php`) and start at
*preparing*. An order can only be declined while it is *pending*.

## API (`/cafe/api/<file>.php`)

| Endpoint | Method | Who | Purpose |
| --- | --- | --- | --- |
| `menu.php` | GET | public | Available menu items with size / sugar / serve options |
| `csrf.php` | GET | public | CSRF token for the current session |
| `orders.php` | POST | public | Place a self-order → `{ orderCode, total, trackToken }` |
| `track.php?t=` | GET | public | Order status by secret tracking token (polled by the customer's phone) |
| `receipt.php?t=` | GET | public | Receipt data by secret receipt token (used by `receipt/`) |
| `login.php` / `logout.php` | POST | cashier | Start / end a PHP session |
| `me.php` | GET | cashier | Who is signed in |
| `queue.php` | GET | cashier | Open orders plus today's completed / declined ones |
| `pay.php` | POST | cashier | Cash or GCash payment with optional discount; pending → preparing |
| `status.php` | PATCH | cashier | ready, completed, or declined (with reason and note) |
| `walkin.php` | POST | cashier | Create a walk-in order and its payment in one transaction |
| `history.php?from=&to=&status=` | GET | cashier | Finished orders in a date range (history and sales report) |

Every endpoint answers the wrong HTTP method with 405 and every error as
`{"error": "message"}`.

## Code structure (object-oriented PHP)

Each endpoint file is short: it checks the method, the CSRF token and the
cashier's sign-in, calls a class, and sends JSON. The classes are in `api/src/`
(blocked from the browser by `api/src/.htaccess`) and load automatically through
`api/src/bootstrap.php`.

| Class | Responsibility |
| --- | --- |
| `Request`, `Response` | Read the JSON body and check the method; send JSON |
| `ErrorHandler` | Turns any exception into a JSON error, so endpoints need no try/catch |
| `ApiException` → `PayException` | An error the user should see (status, message, headers); payment errors extend it |
| `Database` | One shared PDO connection, made from `api/db.php` |
| `Session` | Session cookie, CSRF token, signed-in cashier, 12-hour expiry |
| `RateLimiter` | Per-IP request limits |
| `LoginService` | Password check and the 5-strike lockout |
| `MenuRepository`, `OrderRepository` | Read the menu and orders (queue, history, tracking, receipts) |
| `OrderService` | Prices carts, creates self-orders and walk-ins, changes order status |
| `PaymentService` | Cash / GCash, discounts, pending → preparing |

OOP ideas used: classes and objects (`new OrderService($pdo)`), encapsulation
(private methods and constants), inheritance (`PayException extends
ApiException`), dependency injection (services receive the PDO connection), and
separation of concerns (repositories read, services change data, endpoints
handle HTTP). `api/db.php` (git-ignored) holds the database login and is also
blocked from the browser.

## Business rules (enforced by the server)

The browser shows prices for display only; every price and total is computed
again from the database.

- Size: Small −₱20, Medium +₱0, Large +₱20 (only items with sizes).
  Hot-only and iced-only drinks always get their fixed temperature.
- Discount: 20% of the subtotal for PWD, Senior Citizen or Student.
- Cash tendered must cover the total. GCash reference numbers are 10–13 digits
  and can be used only once.
- Order code = order id padded to 3 digits (`#001`).
- Status changes must follow the diagram above; a second cashier acting on the
  same order gets a "refresh the queue" message.

## Security measures

- Passwords hashed with bcrypt; the same error for a wrong username or password.
- A cashier account is locked for 5 minutes after 5 wrong passwords.
- PHP session cookie is `HttpOnly` and `SameSite=Lax`; the session ID is renewed
  at login and the session expires after 12 hours.
- Every POST / PATCH needs an `X-CSRF-Token` header that matches the session.
- Per-IP rate limits: 60 orders and 20 logins per 10 minutes.
- Prepared statements (PDO) for every query.
- Customers follow orders with a random 128-bit token instead of the order number.
- `api/.htaccess` blocks direct access to helper files and sends `nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` and `Cache-Control: no-store`.
- Text typed by customers and cashiers is shown with `textContent` or escaped
  before it is inserted into a page.

## Testing

Tested on XAMPP (Apache 2.4.58, PHP 8.2.12, MariaDB 10.4.32) with curl and with
scripted Microsoft Edge sessions at phone (412 px) and laptop (1366 px) widths:

- Full order life cycle: place → track → pay with discount → ready → completed
  → receipt, and decline with a note.
- Walk-in orders with cash and GCash; a reused GCash reference is refused and
  nothing is saved.
- Server-side pricing ignores prices sent by the browser.
- CSRF: requests without the header or with a wrong token get 403.
- Lockout: the 6th attempt after 5 wrong passwords gets 429, even with the
  correct password.
- Rate limit: requests over the limit get 429 with `Retry-After`.
- Helper files return 403 when opened directly.
- Every customer and cashier page at 412 px without horizontal scrolling.

## Known limitations

- No HTTPS on the local XAMPP server, so traffic on the café Wi-Fi is not encrypted.
- Rate limits count per IP address; customers on the same Wi-Fi share one limit.
- Order status updates reach the customer only while the status page is open.
- The sales report counts completed orders only. Its category bars and top
  items show amounts before discounts; Total Revenue is after discounts.
- An order number can be skipped when a walk-in payment is refused (the order
  is rolled back but MySQL does not reuse the id).
- Discounts do not record the PWD / Senior / Student ID number.
- A locked account tells the user it is locked, which shows that the username exists.

## Looking after the database

- Stop **MySQL** and **Apache** in the XAMPP Control Panel before shutting down
  the computer. Unclean shutdowns have corrupted the database before.
- After changing data or tables, re-export the database:
  ```
  C:\xampp\mysql\bin\mysqldump.exe -u root --routines --databases cafe_pos --result-file="C:\xampp\htdocs\cafe\database\cafe_pos.sql"
  ```
