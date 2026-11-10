# QR Cafe – Cashier / POS Module

Plain **HTML5 + CSS3 + JavaScript + Tailwind CSS** version of the original
React + Vite cashier app. No framework and no build step is needed to run it.
Companion to the customer module (`qr-cafe`).

## Run it (XAMPP)

1. Set up the repository and database as described in the main `README.md`
   (the repository lives at `C:\xampp\htdocs\cafe`)
2. Start **Apache** and **MySQL** in the XAMPP Control Panel
3. Open `http://localhost/cafe/qr-cafe-cashier-html/qr-cafe-cashier/`
4. Sign in with a cashier account from `tbl_cashiers`

Use `http://`, not `file://`. With `USE_MOCK_DATA: true` the pages also run on
any static server with demo data and accept any credentials.

## Pages

| File | Screen |
| --- | --- |
| `login.html` | Cashier sign-in (`index.html` redirects here) |
| `queue.html` | Live Orders Queue: New / Preparing / Ready / Completed / Declined |
| `workspace.html?id=186` | Order Workspace: review, discount, take payment (opened by **Accept**) |
| `manual.html` | Walk-in & Manual Ordering: menu, item customization, cart |
| `checkout.html` | Payment Checkout for manual orders |
| `history.html` | Order History: search, status filter, details / decline reason |
| `report.html` | Sales & Performance: stats, category split, top items, CSV export |

Order flow: **New** → *Accept* (workspace: payment) → **Preparing** →
*Mark Ready* → **Ready** → *Complete Order* → **Completed**.
*Decline* (with reason + note) moves a new order to **Declined**.
Manual orders skip *New*: they are paid at checkout and start as **Preparing**.

## Folder structure

```
qr-cafe-cashier/
├── index.html · login.html · queue.html · workspace.html
├── manual.html · checkout.html · history.html · report.html
├── package.json            Tailwind CLI scripts (optional)
└── assets/
    ├── css/
    │   ├── input.css       Tailwind source: theme tokens + named components
    │   └── tailwind.css    Compiled output (already built, loaded by pages)
    └── js/
        ├── config.js       USE_MOCK_DATA, API_BASE_URL, QUEUE_REFRESH_MS
        ├── data.js         Menu, demo orders, business constants, helpers
        ├── store.js        localStorage (demo orders) + sessionStorage (session, cart)
        ├── api.js          The only file that talks to the back end
        ├── ui.js           Escaping, icons, badges, QR graphic, toast
        ├── layout.js       Login guard, sidebar, live clock, logout
        ├── modals.js       Native <dialog> modals (customize, decline, receipt, …)
        └── pages/          One script per page
```

The sidebar is injected by `layout.js` so the navigation lives in one place.
If you move to PHP, replace it with an `include` of a shared partial.

## Editing styles

All styling is in `assets/css/input.css`. HTML uses short, named component
classes built from Tailwind utilities with `@apply`:

```html
<button class="btn btn--primary btn--block">Pay &amp; Send to Kitchen</button>
<article class="order-card order-card--ready">
  <span class="order-card__id">#184</span>
</article>
```

| Pattern | Meaning | Example |
| --- | --- | --- |
| `block` | a component | `btn`, `order-card`, `nav-link` |
| `block__element` | a part of it | `order-card__total` |
| `block--modifier` | a variant | `badge--ready`, `btn--sm` |
| `[aria-pressed]` `[aria-selected]` `[aria-current]` | selected state | `.chip`, `.nav-link` |

`input.css` has a table of contents. After editing it (or adding new class
names to HTML/JS) rebuild:

```
npm install
npm run build:css      # one-off
npm run watch:css      # rebuild on save
```

## Connecting the PHP / MySQL back end

`assets/js/config.js` has `USE_MOCK_DATA: false`, so the pages call the PHP API
in `/cafe/api` (see the main `README.md` in the repository root). `api.js` is the
only file that talks to it, one function per endpoint:

| `Cafe.api.` | Endpoint | Used by |
| --- | --- | --- |
| `login` / `logout` | `POST login.php` / `POST logout.php` | login page, sidebar |
| `getMenu` | `GET menu.php` (mapped to `isDrink` / `tempOptions`) | manual entry, report |
| `getOrders` | `GET queue.php` (open orders + today's finished ones) | queue, workspace |
| `setStatus` | `PATCH status.php` `{ id, status, reason, note }` | queue |
| `pay` | `POST pay.php` `{ orderId, method, cashTendered / gcashRef, discountType, discountIdNo }` | workspace |
| `walkIn` | `POST walkin.php` (order + payment in one step) | checkout |
| `getHistory` | `GET history.php?from=&to=&status=` | history, report |

Orders come back as `{ id, code, customer, type, items, subtotal, total, status,
createdAt, completedAt, paymentMethod, receiptToken, declineReason, declineNote }`
with `status` `new | preparing | ready | completed | declined`. Screens show
`code` (`#001`, the number the customer sees); `id` is used for actions.

POST / PATCH requests carry an `X-CSRF-Token` header from `csrf.php`. The server
checks the session on every request, recomputes prices, the 20% discount and the
total from the database, and only allows `new → preparing` (by paying) or
`declined`, `preparing → ready`, `ready → completed`. A 401 sends the browser
back to the login page; the login guard in `layout.js` is only for convenience.
Set `USE_MOCK_DATA: true` to run the pages without PHP.

## Small behavior changes from the React version

- **Discount from the workspace is now saved.** Before, a PWD / Senior /
  Student discount applied while accepting a QR order changed only the screen
  and receipt; the stored order kept the full price, so reports overstated sales.
- **Report dates use local time.** The original used UTC, which shifted the
  start date back a day in the Philippines (UTC+8).
- **CSV export is quoted properly** (names with commas no longer break rows)
  and guards against spreadsheet formula injection.
- **Workspace payment fields reset** when you switch to another order.
- **The queue refreshes every 15 s** so new QR orders appear (and "x mins ago"
  stays current). Change `QUEUE_REFRESH_MS` in `config.js`.
- **Print** prints only the open receipt. *Print Receipt* in order details was
  a dead button before.
- Dialogs use native `<dialog>`: Esc closes them and focus is trapped.
- Demo mode resets the sample orders each time you sign in.

## Still open

- The demo menu in `data.js` (16 items) is only used with `USE_MOCK_DATA: true`;
  the real screens use `tbl_menu_items` through `menu.php`, like the customer app.
- On the sales report, the category bars and top items show amounts before
  discounts, while Total Revenue is after discounts.
- Menu photos load from Unsplash, as in the original.
