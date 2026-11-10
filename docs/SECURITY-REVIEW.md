# Security Review: QR Café Self-Ordering and POS System

| | |
| --- | --- |
| **Date** | November 4, 2026 |
| **Scope** | Whole repository: PHP API (`api/`), customer app, cashier app, e-receipt page, database export |
| **Focus** | Cross-site request forgery (CSRF), SQL injection, authentication and sessions |
| **Branch** | `feature/security-hardening` |
| **Result** | No CSRF or SQL injection vulnerabilities. 5 authentication/session issues and 4 hardening gaps found; all 9 addressed. One (HTTPS) also needs a server setting that the code can't do by itself. |

## 1. Summary of findings

| # | Issue | Severity | Status |
| --- | --- | --- | --- |
| 1 | Anyone on the café Wi-Fi could keep the cashier account locked out | Medium | Fixed |
| 2 | Password and session cookie sent unencrypted over Wi-Fi (no HTTPS, cookie not `Secure`) | Medium | Fixed in code; HTTPS must be turned on in Apache |
| 3 | Sessions survived a password change or account removal; no idle timeout | Low | Fixed |
| 4 | Response time revealed which usernames exist | Low | Fixed |
| 5 | PHP warnings exposed server file paths in API responses | Low | Fixed |
| H1 | Session ids chosen by an attacker were accepted (`use_strict_mode` off) | Hardening | Fixed |
| H2 | Session cookie sent to every app on the server (path `/`) | Hardening | Fixed |
| H3 | API connected to MySQL as `root` | Hardening | Fixed |
| H4 | Pages had no Content-Security-Policy or anti-framing header | Hardening | Fixed |

## 2. Areas with no vulnerabilities

### CSRF: no vulnerabilities found

- Every endpoint that changes data (`login`, `logout`, `orders`, `pay`, `status`, `walkin`) requires an `X-CSRF-Token` header.
- The header must match a 256-bit random token stored in the session. The comparison uses `hash_equals`, which takes the same time whether or not the token matches.
- Another website can make the browser send our cookie, but it cannot read the token from `csrf.php` (no CORS headers are sent). So it cannot send the header.
- The session cookie is also `SameSite=Lax`, and no GET endpoint changes data.
- Re-tested after the changes: a POST without the token still gets 403.

### SQL injection: no vulnerabilities found

- Every value that comes from the browser is sent to the database as a bound `?` parameter of a PDO prepared statement.
- Only `OrderRepository::fetch()` builds SQL from strings, and it is safe:
  - `$where` and `$orderBy` are fixed strings written in the code.
  - `IN (...)` lists use generated `?` placeholders.
  - `LIMIT` is cast to an integer.
- Fix H3 adds a second layer: even an injection bug could no longer delete rows or change tables.

### Things already done well

- bcrypt password hashing and a new session id at sign-in.
- Prices are recalculated on the server.
- Tracking and receipt links use random 128-bit tokens.
- The order row is locked so an order can't be paid twice.
- Rate limiting uses the real connection IP (`REMOTE_ADDR`), not a header anyone can fake.
- Helper files are blocked from the browser.
- Customer-typed text is escaped everywhere it is displayed.

## 3. Findings and fixes

### 1. Cashier lockout could be abused (Medium)

**Problem.** Wrong passwords were counted per account. After 5 wrong passwords, the account was locked for 5 minutes for everyone.

**Risk.** A customer on the café Wi-Fi who knew or guessed the username `cashier01` could send 5 wrong passwords every 5 minutes. The real cashier would then never be able to sign in. The per-IP limit of 20 logins per 10 minutes did not stop this.

**Fix.**
- Wrong passwords are now counted per **username and IP address together**. After 5 failures, only the device that is guessing is blocked from that username for 5 minutes. The cashier signs in from a different IP address and is not affected.
- A per-account backstop remains: 50 failures from all addresses together lock the account for 15 minutes. This covers guessing from many devices at once.
- Failures are stored in the existing `tbl_rate_limit` table, so no database change is needed. A successful sign-in clears that device's counter.

**Files.** `api/src/LoginService.php`, `api/src/RateLimiter.php` (new `check()`, `record()` and `clear()` methods), `api/login.php`.

**Verified.**
- 5 wrong passwords, then the right one from the same IP: 429.
- The account itself is not locked.
- The same account signs in from another IP: 200.
- The 50th failure locks the account: 429.

### 2. No encryption on the Wi-Fi (Medium)

**Problem.** The system runs on plain HTTP. The session cookie did not have the `Secure` flag.

**Risk.** Anyone on the same Wi-Fi could capture:
- the cashier's password when they sign in, or
- the session cookie, which would let them act as the cashier (take payments, decline orders).

**Fix.**
- **In code:** the session cookie is now marked `Secure` automatically whenever the request comes over HTTPS. The browser then never sends it over plain HTTP. On plain HTTP it can't be `Secure`, or sign-in would stop working.
- **Server setup:** the README has a new *Turning on HTTPS* section, using XAMPP's SSL module with a certificate made by `mkcert`.
- **Redirect:** the root `.htaccess` has a ready-made redirect from `http://` to `https://`, commented out. Turn it on once HTTPS works.

**Files.** `api/src/Session.php`, `.htaccess`, `README.md`.

**Still to do.** Encryption only starts once someone turns on SSL in Apache on the café laptop. That is a server setting the repository can't change.

### 3. Sessions outlived password changes; no idle timeout (Low)

**Problem.** The server only checked the session itself.
- After a cashier was deleted or their password was changed, sessions they already had kept working for up to 12 hours.
- A cashier screen left unattended also stayed signed in for 12 hours.

**Fix.**
- **Idle timeout.** Cashiers are signed out after **30 minutes without activity**. The queue page refreshes itself every 15 seconds; those background requests now send `?poll=1` and do not count as activity. So an unattended screen still signs out. The 12-hour maximum stays.
- **Account check.** At sign-in, a SHA-256 fingerprint of the stored password hash is saved in the session. Every cashier request compares it with the database. A changed password or a deleted account ends the session immediately, with a 401 and a sign-in prompt.

**Files.** `api/src/Session.php`, `api/login.php`, `api/queue.php`, `qr-cafe-cashier-html/qr-cafe-cashier/assets/js/api.js`, `qr-cafe-cashier-html/qr-cafe-cashier/assets/js/pages/queue.js`.

**Verified.**
- A background poll does not refresh the activity time; a normal request does.
- After 31 idle minutes the session gets 401 with the idle message.
- Resetting the password in the database ends an open session (401).

### 4. Usernames could be discovered (Low)

**Problem.**
- For an unknown username the server skipped the bcrypt check, so it answered about 50–100 ms faster than for a real username with a wrong password.
- The "account locked" message also only ever appeared for real usernames.

**Fix.**
- For unknown usernames, the password is now checked against a fixed dummy bcrypt hash with the same cost (10). Both cases take the same time.
- The per-IP lock works for any username, real or not.
- Both locks use the same message.

**Files.** `api/src/LoginService.php`.

**Verified.**
- Response times measured 0.578 s (real user) and 0.582 s (unknown user).
- An unknown username is locked after 5 tries with the same message as a real one.

**Remaining.** After 50 failures from several devices, the account-wide lock still applies only to real accounts. This is noted in the README.

### 5. Server paths leaked through PHP warnings (Low)

**Problem.**
- XAMPP ships with `display_errors=On`.
- Input such as `track.php?t[]=x`, or a JSON body with `"name": ["x"]`, sends an array where the code expected text. Casting that array to a string raised the warning *"Array to string conversion"*.
- PHP printed the warning, with the full file path (e.g. `C:\xampp\htdocs\cafe\api\src\Request.php`), into the response. Confirmed on the project's XAMPP (PHP 8.2.12).

**Fix.**
- `bootstrap.php` turns `display_errors` off for every endpoint. Warnings still go to the PHP error log.
- `Request::query()` treats a non-text query value as missing.
- The new `Request::text()` refuses a non-text JSON field with `400 Invalid request`. It is used for username, password, customer name and decline note.
- The GCash reference in `PaymentService` gets the same check.

**Files.** `api/src/bootstrap.php`, `api/src/Request.php`, `api/login.php`, `api/orders.php`, `api/walkin.php`, `api/status.php`, `api/src/PaymentService.php`.

**Verified.** Array input to `track.php`, `receipt.php`, `login.php`, `orders.php`, `pay.php` and `status.php` returns a clean 400 with no warning text, even with XAMPP's `display_errors=On`.

### H1. Attacker-chosen session ids were accepted

**Fix.** `session.use_strict_mode` is turned on. A session id the server never created is replaced with a new one.

**Verified.** A request with `Cookie: cafe_sid=attackerchosenid12345` received a different, new id.

### H2. Session cookie shared with other apps on the server

**Fix.** The cookie path is now `/cafe/`, so phpMyAdmin and other projects in `htdocs` no longer receive it. The cookie was renamed from `cafe_session` to `cafe_sid`, so the old cookie with path `/` is simply ignored.

**Verified.** `Set-Cookie: cafe_sid=...; path=/cafe/; HttpOnly; SameSite=Lax`.

### H3. API used the MySQL root account

**Fix.** The new script `database/create_app_user.sql` creates `cafe_app`, which can only SELECT, INSERT and UPDATE in `cafe_pos`. The API never deletes rows: resetting a rate-limit counter was written as an UPDATE so no DELETE right is needed. `db.example.php` and the README setup steps now use this account.

**Verified.** The whole order flow (place, pay, ready, completed, decline, walk-in, track, receipt, history, logout) worked while connected as `cafe_app`.

### H4. No Content-Security-Policy on the pages

**Fix.**
- The root `.htaccess` now sends these headers on every page: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: same-origin`.
- The policy allows scripts only from our own files, styles from our files and Google Fonts, images from our server and Unsplash, and requests only to our own API. It forbids other sites from framing the pages.
- To make the pages work under this policy:
  - the e-receipt page's inline CSS and JavaScript moved to `receipt/receipt.css` and `receipt/receipt.js`;
  - its `onclick` print button became an event listener;
  - the sales report's bar widths are now set from JavaScript instead of inline `style=""` attributes.

**Files.** `.htaccess`, `receipt/index.html`, `receipt/receipt.css`, `receipt/receipt.js`, `qr-cafe-cashier-html/qr-cafe-cashier/assets/js/pages/report.js`.

**Verified.** A search of every page and script found no remaining inline scripts, inline event handlers, `style=""` attributes, `javascript:` links or `eval`. The headers themselves are sent by Apache, and the test setup did not include Apache (see section 4).

## 4. How the fixes were tested

The changed code ran against a temporary database and PHP server, separate from the team's XAMPP data:

- MariaDB 10.4 from XAMPP on port 3399, loaded with `database/cafe_pos.sql`.
- PHP 8.2.12's built-in server, using XAMPP's own `php.ini` (so `display_errors=On`).
- The API connected as the limited `cafe_app` account.

A script of **43 checks** covered every finding above plus a regression pass through the normal order flow. **All 43 passed.** All PHP files pass `php -l`, and the changed JavaScript files pass `node --check`.

**Not tested here:**
- The `.htaccess` headers (CSP, anti-framing), because the PHP built-in server ignores `.htaccess`.
- The HTTPS setup.

After deploying to XAMPP, open each page with the browser's developer tools (F12 → Console) and check that no "Content-Security-Policy" errors appear. In particular:
- the customer menu (Unsplash photos),
- the cashier login (photo and Google Fonts),
- the sales report bars,
- the e-receipt barcode and print button.

## 5. Deployment checklist for the team

1. Pull the branch and copy it into `C:\xampp\htdocs\cafe`.
2. Run `database/create_app_user.sql` (with your own password in place of `CHANGE-ME`) and update `api/db.php` to use `cafe_app`.
3. Restart Apache. Check the pages for CSP errors as described in section 4.
4. Expect cashiers to be signed out once: old sessions don't have the new idle and account fields.
5. Network cashier access now redirects to HTTPS automatically (README → *HTTPS*).
6. If a menu photo is added from a website other than Unsplash, add that host to `img-src` in `.htaccess`.

## 6. Second review (November 10, 2026)

A second audit tested the running system on Apache and found issues the first review missed. The first review checked the code but not which files Apache serves.

| Issue | Severity | Status | Fix |
| --- | --- | --- | --- |
| Anyone on the Wi-Fi could download `cafe_pos.sql` with the cashier's password hash; folders were listed | High | Fixed | Root, `database/` and `docs/` `.htaccess` rules; listings off |
| The password hash was in the public repository and matched a common password | High | Hash removed; **the password must be changed on every install** | `cafe_pos.sql` holds no hash; `strip-password-hashes.php` cleans future exports |
| Fake orders could push real orders off the 500-row queue | Medium | Fixed | Paid orders first, then newest unpaid; unpaid orders leave after 12 hours |
| The sales report silently stopped at 500 orders | Medium | Fixed | Limit raised to 20,000; larger ranges are refused |
| Cashier sign-in was unencrypted on the Wi-Fi | Medium | Fixed for cashiers | Network cashier access redirects to HTTPS |
| Simultaneous guesses got past the 5-try limit | Low | Fixed | Attempts counted before the password check |
| Very large cash amounts caused a server error | Low | Fixed | Validated, with a maximum of 1,000,000 |
| PHP used Berlin time, so early-morning receipts had the wrong date | Low | Fixed | Time zone set to Asia/Manila |
| PHP could delete idle sessions after 24 minutes | Low | Fixed | Session files kept for 12 hours |
| Apache and PHP versions were visible | Low | Fixed | `X-Powered-By` removed; `ServerTokens Prod` set in XAMPP (server setting) |

**Not changed:** GCash remains unverified (out of scope), and customer pages stay on HTTP. MySQL `root` still has no password because other projects on the same XAMPP may rely on that; XAMPP's default `root` accounts only accept connections from the laptop itself.

**Follow-up:** IDs and quantities sent as `true` are now refused, self-orders are limited to 20 per 10 minutes per device, and a new certificate for the laptop's IP address replaced XAMPP's expired one. On the laptop's XAMPP, the file blocking, HTTPS redirect, certificate and hidden version were confirmed. MySQL did not start there because four internal permission tables are damaged, so the cashier password change is still pending.

**Testing:** 56 checks of these fixes plus a repeat of the attack suite passed on Apache 2.4.58 with HTTP and HTTPS, using a throwaway database. A real Edge browser found no XSS and no Content-Security-Policy violations on any page. The password change and the certificate warning on a real phone still need a manual check.
