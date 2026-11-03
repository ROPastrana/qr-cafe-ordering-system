# QR Cafe – Customer Self-Ordering Portal

Plain **HTML5 + CSS3 + JavaScript + Tailwind CSS** version of the original
React + Vite project. No framework and no build step is needed to run it.

## Run it (XAMPP)

1. Set up the repository and database as described in the main `README.md`
   (the repository lives at `C:\xampp\htdocs\cafe`)
2. Start **Apache** and **MySQL** in the XAMPP Control Panel
3. Open `http://localhost/cafe/qr-cafe-customer-html/qr-cafe/`
   (on a phone: the laptop's IP address instead of `localhost`)

Use `http://`, not `file://`, so session storage and navigation behave
consistently. With `USE_MOCK_DATA: true` the pages also run on any static
server with demo data.

## Pages

| File | Screen (proposal figure) |
| --- | --- |
| `index.html` | Landing / splash (Fig. 5) |
| `menu.html` | Menu with category tabs and cart bar (Fig. 6) |
| `item.html?id=1` | Order customization (Fig. 7) |
| `cart.html` | View cart, name, Dine In / Take Out (Fig. 8) |
| `order-status.html` | Order Received (Fig. 9) or Order Declined (Fig. 10) |

## Folder structure

```
qr-cafe/
├── index.html · menu.html · item.html · cart.html · order-status.html
├── package.json            Tailwind CLI scripts (optional)
└── assets/
    ├── css/
    │   ├── input.css       Tailwind source: theme tokens + custom CSS
    │   └── tailwind.css    Compiled output (already built, loaded by pages)
    └── js/
        ├── config.js       USE_MOCK_DATA, API_BASE_URL
        ├── data.js         Menu data, constants, price helpers
        ├── store.js        Cart / form / last order (sessionStorage)
        ├── api.js          The only file that talks to the back end
        ├── ui.js           Escaping, pills, stepper markup
        └── pages/          One script per page
```

## Editing styles

All styling lives in `assets/css/input.css`. The HTML uses short, named
component classes; each one is built from Tailwind utilities with `@apply`.

```html
<a class="btn-back" href="menu.html">…</a>
<article class="menu-card">
  <img class="menu-card__img" …>
  <p class="menu-card__name">Spanish Latte</p>
</article>
```

**Naming convention (BEM-lite)**

| Pattern | Meaning | Example |
| --- | --- | --- |
| `block` | a component | `btn-back`, `menu-card`, `stepper` |
| `block__element` | a part of that component | `menu-card__name`, `cart-card__price` |
| `block--modifier` | a variant | `btn-back--overlay`, `pill--serve` |
| `[aria-pressed="true"]` / `[aria-selected="true"]` | selected state | `.pill`, `.tab` |

`input.css` has a table of contents at the top (theme tokens, buttons, menu,
item, cart, status, splash, responsive). Small one-off spacing such as `mb-4`
or `mt-2` is still written directly in the HTML.

After editing `input.css` (or adding new class names to the HTML/JS), rebuild:

```
npm install
npm run build:css      # one-off
npm run watch:css      # rebuild on save
```

The colour palette lives in the `@theme` block (`--color-cafe-accent`, …).

## Connecting the PHP / MySQL back end

`assets/js/config.js` has `USE_MOCK_DATA: false`, so the pages call the PHP API
in `/cafe/api` (see the main `README.md` in the repository root). `api.js` is the
only file that talks to it:

| Page | Call |
| --- | --- |
| menu, item, cart | `GET menu.php` |
| cart | `POST orders.php` `{ name, orderType, items: [{ itemId, qty, size, sugarLevel, serve }] }` → `{ orderCode, total, trackToken }` |
| order status | `GET track.php?t=<trackToken>` every 5 s → `{ status, declineReason, declineNote, receiptToken }` |

POST requests carry an `X-CSRF-Token` header; `apiFetch()` gets the token from
`csrf.php`. The browser shows prices for display only: `orders.php` looks up
every price in `tbl_menu_items`, applies the size surcharge and computes the
total itself. Set `USE_MOCK_DATA: true` to run the pages without PHP.

## What changed from the React version

- Each screen is its own HTML page (matches the PHP multi-page stack); the
  cart, name and order type persist between pages via `sessionStorage`.
- React state became plain JS modules; `useState` re-renders became in-place
  DOM updates.
- Inline `style={{ color: C.x }}` became named component classes (see above).
- Buttons that only navigate are now `<a>` links.
- User-entered text is HTML-escaped before it is inserted into the page.
- The cart merges identical lines (same item, size, sugar, serve), same as before.
- Menu photos still load from Unsplash, as in the original.
