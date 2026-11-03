# QR Cafe – Customer Self-Ordering Portal

Plain **HTML5 + CSS3 + JavaScript + Tailwind CSS** version of the original
React + Vite project. No framework and no build step is needed to run it.

## Run it (XAMPP)

1. Copy this folder to `C:\xampp\htdocs\qr-cafe\`
2. Start **Apache** in the XAMPP Control Panel
3. Open `http://localhost/qr-cafe/`

Any static server works too (`php -S localhost:8000`, VS Code Live Server).
Use `http://`, not `file://`, so session storage and navigation behave
consistently.

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

In `assets/js/config.js` set `USE_MOCK_DATA: false`. The pages then call
`api.js`, which expects:

**GET `api/menu`** → `{ "data": [ ... ] }` where each row is either the
front-end shape (`id, name, description, price, image, category, popular,
hasSize, hasSugar, hasServe`) or the DB shape (`item_id, item_name,
description, base_price, image_url, category_name, is_available`).

**POST `api/orders`** (JSON, with `X-CSRF-Token` if a `csrf-token` meta tag is
present):

```json
{
  "customer_name": "Maria",
  "order_type": "self_order",
  "service_type": "Dine In",
  "items": [
    { "item_id": 1, "quantity": 2, "size": "Large",
      "sugar_level": "50%", "temperature": "Hot" }
  ]
}
```

→ `{ "data": { "order_id": 12, "order_code": "A-104" } }`

The browser shows prices for display only. The server must look up
`tbl_menu_items.base_price`, apply the size surcharge, and compute the total
itself (Section J: server validation against price manipulation).

## Gaps between the UI and the data dictionary

These are not blockers for the front end, but the schema needs a decision:

- **Dine In / Take Out** has no column in `tbl_orders`.
- **Popular items** and per-item **has size / sugar / serve** flags (e.g.
  "Served hot only") have no columns in `tbl_menu_items`. `api.js` falls back
  to "drinks have size and sugar; pastries have none".
- **Size surcharge** (Small −₱20, Large +₱20) is defined in `data.js` and must
  be mirrored on the server.
- Item ids are numeric to match `item_id`; the original React code used
  strings such as `"c1"`.

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
