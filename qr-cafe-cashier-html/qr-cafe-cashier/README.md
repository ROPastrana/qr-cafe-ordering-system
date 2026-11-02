# QR Cafe – Cashier / POS Module

Plain **HTML5 + CSS3 + JavaScript + Tailwind CSS** version of the original
React + Vite cashier app. No framework and no build step is needed to run it.
Companion to the customer module (`qr-cafe`).

## Run it (XAMPP)

1. Copy this folder to `C:\xampp\htdocs\qr-cafe-cashier\`
2. Start **Apache** in the XAMPP Control Panel
3. Open `http://localhost/qr-cafe-cashier/`
4. Click **Sign In to POS** (demo mode accepts the prefilled credentials)

Any static server works too (`php -S localhost:8000`, VS Code Live Server).
Use `http://`, not `file://`.

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

In `assets/js/config.js` set `USE_MOCK_DATA: false`. `api.js` then calls
(JSON, same-origin cookies, `X-CSRF-Token` header on writes when a
`csrf-token` meta tag exists):

| Call | Purpose |
| --- | --- |
| `POST api/auth/login` `{username, password}` → `{name, role}` | start PHP session; 401 + `{message}` on failure |
| `POST api/auth/logout` | end session |
| `GET api/menu` | menu items |
| `GET api/orders` | all of today's orders |
| `POST api/orders` | create a walk-in order (starts as `preparing`) |
| `PATCH api/orders/{id}` | change status, payment, discount, decline info |

**Order JSON** (responses; `createdAt` / `completedAt` are ISO-8601 strings):

```json
{
  "id": 186, "customer": "Maya R.", "type": "Dine In",
  "items": [{ "name": "Spanish Latte", "qty": 1, "unitPrice": 200,
              "variant": "Large · 50% Sugar · Cold" }],
  "subtotal": 370, "discount": 74, "discountType": "PWD", "total": 296,
  "status": "new", "note": "…", "createdAt": "2026-11-02T08:15:00+08:00",
  "completedAt": null, "paymentMethod": "cash", "gcashReference": "1234567890",
  "declineReason": "Out of Stock", "declineNote": "…"
}
```

`status`: `new | preparing | ready | completed | declined`.
`type`: `Dine In | Take Out`. `paymentMethod`: `cash | gcash`.
**Menu JSON**: `{ id, name, description, category, price, image, isDrink, tempOptions }`
(`tempOptions`: `both | hot-only | cold-only`).

**The server must not trust the browser.** Recompute prices (base price +
size adjustment), the 20% discount and the total from the database, check the
session and role on every request, and validate status changes (e.g. only
`new → preparing | declined`, `preparing → ready`, `ready → completed`).
The login guard in `layout.js` is only for convenience.

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

## Still to decide (unchanged from the design)

- "Mark as Paid" does not check that cash tendered covers the total.
- The "+8.2% / −2.1% vs last week" lines on the report are hard-coded.
- Discounts are applied without capturing a PWD / Senior / Student ID number.
- This menu (16 items, e.g. latte ₱190) differs from the customer module's
  menu (15 items, latte ₱149). With `USE_MOCK_DATA: false` both should read the
  same `tbl_menu_items` through `GET api/menu`.
- Confirm the schema has columns for: Dine In / Take Out, discount type and
  amount, payment method, GCash reference, decline reason and note.
- Menu photos load from Unsplash, as in the original.
