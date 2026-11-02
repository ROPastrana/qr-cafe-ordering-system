/* ==========================================================================
   QR Cafe – Static menu data, constants and pricing helpers
   Item ids are numeric to mirror tbl_menu_items.item_id.
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.CATEGORIES = ["Coffee", "Non-Coffee", "Pastries"];
Cafe.SIZES = ["Small", "Medium", "Large"];
Cafe.SUGAR_LEVELS = ["0%", "25%", "50%", "75%", "100%"];
Cafe.SERVE_OPTIONS = ["Hot", "Cold"];
Cafe.ORDER_TYPES = ["Dine In", "Take Out"];

Cafe.SECTION_LABEL = {
  "Coffee": "Full Coffee Menu",
  "Non-Coffee": "Matcha, Teas & More",
  "Pastries": "Freshly Baked Daily"
};

Cafe.DEFAULTS = { size: "Medium", sugar: "50%", serve: "Hot", qty: 1 };

Cafe.MENU = [
  /* ── Coffee ─────────────────────────────────────────────────────────── */
  {
    id: 1, name: "Salted Caramel Latte",
    description: "Espresso with steamed oat milk and housemade sea-salted caramel syrup.",
    price: 149, image: "https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=400&h=400&fit=crop&auto=format",
    category: "Coffee", popular: true, hasSize: true, hasSugar: true, hasServe: true
  },
  {
    id: 2, name: "Spanish Latte",
    description: "Double shot espresso, sweet condensed milk, and velvety textured fresh milk.",
    price: 139, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop&auto=format",
    category: "Coffee", popular: true, hasSize: true, hasSugar: true, hasServe: true
  },
  {
    id: 3, name: "Cold Brew Honey Oat",
    description: "18-hour slow steeped specialty Arabica beans with cold oat milk and wild honey.",
    price: 159, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=400&fit=crop&auto=format",
    category: "Coffee", popular: false, hasSize: true, hasSugar: true, hasServe: false
  },
  {
    id: 4, name: "Classic Cappuccino",
    description: "A shot of espresso balanced with equal parts steamed milk and a thick cap of warm foam, dusted with cocoa. Served hot only.",
    price: 129, image: "https://images.unsplash.com/photo-1497636577773-f1231844b336?w=400&h=400&fit=crop&auto=format",
    category: "Coffee", popular: false, hasSize: true, hasSugar: true, hasServe: false
  },
  {
    id: 5, name: "Velvet Flat White",
    description: "Two ristretto shots topped with a silky layer of velvety microfoam for a smooth, full-bodied finish.",
    price: 139, image: "https://images.unsplash.com/photo-1529892485617-25f63cd7b1e9?w=400&h=400&fit=crop&auto=format",
    category: "Coffee", popular: false, hasSize: true, hasSugar: true, hasServe: true
  },

  /* ── Non-Coffee ─────────────────────────────────────────────────────── */
  {
    id: 6, name: "Uji Matcha Latte",
    description: "Ceremonial grade Japanese Uji green tea, stone-milled and whisked to a fine foam, then poured over creamy steamed oat milk.",
    price: 159, image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop&auto=format",
    category: "Non-Coffee", popular: true, hasSize: true, hasSugar: true, hasServe: true
  },
  {
    id: 7, name: "Hibiscus Berry Iced Tea",
    description: "Premium brewed hibiscus tea shaken hard with organic strawberry puree and fresh lemon, poured over crushed ice. Served iced only.",
    price: 139, image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&h=400&fit=crop&auto=format",
    category: "Non-Coffee", popular: true, hasSize: true, hasSugar: true, hasServe: false
  },
  {
    id: 8, name: "Belgian Hot Chocolate",
    description: "Steamed fresh milk melted with real dark Belgian chocolate callets for a thick, glossy cup. Served hot only.",
    price: 149, image: "https://images.unsplash.com/photo-1648192312898-838f9b322f47?w=400&h=400&fit=crop&auto=format",
    category: "Non-Coffee", popular: false, hasSize: true, hasSugar: true, hasServe: false
  },
  {
    id: 9, name: "Hokkaido Taro Milk Tea",
    description: "Creamy Hokkaido taro root blended with slow-brewed black tea and slow-cooked brown sugar for a mellow, nutty finish.",
    price: 129, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format",
    category: "Non-Coffee", popular: false, hasSize: true, hasSugar: true, hasServe: true
  },
  {
    id: 10, name: "Peach Blossom Oolong",
    description: "Loose-leaf high mountain oolong shaken with organic peach nectar and fresh mint leaves over ice. Served iced only.",
    price: 119, image: "https://images.unsplash.com/photo-1601390395693-364c0e22031a?w=400&h=400&fit=crop&auto=format",
    category: "Non-Coffee", popular: false, hasSize: true, hasSugar: true, hasServe: false
  },

  /* ── Pastries ───────────────────────────────────────────────────────── */
  {
    id: 11, name: "Pistachio Rose Croissant",
    description: "Flaky twice-baked butter croissant loaded with thick pistachio frangipane, crushed Sicilian pistachios and dried rose petals.",
    price: 129, image: "https://images.unsplash.com/photo-1623334044303-241021148842?w=400&h=400&fit=crop&auto=format",
    category: "Pastries", popular: true, hasSize: false, hasSugar: false, hasServe: false
  },
  {
    id: 12, name: "Pain au Chocolat",
    description: "Classic French pastry of butter-laminated dough folded around two batons of dark chocolate, baked to a deep golden crust.",
    price: 99, image: "https://images.unsplash.com/photo-1773894470970-2908e13f3940?w=400&h=400&fit=crop&auto=format",
    category: "Pastries", popular: true, hasSize: false, hasSugar: false, hasServe: false
  },
  {
    id: 13, name: "Blueberry Cream Cheese Danish",
    description: "Crisp puff pastry nest filled with sweet blueberry compote and whipped cream cheese, finished with a vanilla glaze.",
    price: 119, image: "https://images.unsplash.com/photo-1702742322469-36315505728f?w=400&h=400&fit=crop&auto=format",
    category: "Pastries", popular: false, hasSize: false, hasSugar: false, hasServe: false
  },
  {
    id: 14, name: "Salted Caramel Pecan Bun",
    description: "Soft cinnamon yeast roll topped with warm salted caramel and roasted pecans, baked fresh every morning.",
    price: 109, image: "https://images.unsplash.com/photo-1583527976767-5399024eeb05?w=400&h=400&fit=crop&auto=format",
    category: "Pastries", popular: false, hasSize: false, hasSugar: false, hasServe: false
  },
  {
    id: 15, name: "Basque Burnt Cheesecake",
    description: "Deeply caramelized crustless cheesecake with a custardy, semi-liquid centre. Best paired with a black coffee.",
    price: 159, image: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=400&fit=crop&auto=format",
    category: "Pastries", popular: false, hasSize: false, hasSugar: false, hasServe: false
  }
];

/* ---- Pricing / formatting helpers ---- */
Cafe.fmtPrice = function (n) { return "₱" + n; };
Cafe.fmtCalc  = function (n) { return "₱" + Number(n).toFixed(2); };

/* Small = -₱20, Large = +₱20 (display only; the server must re-price orders). */
Cafe.sizeAdj = function (size) {
  return size === "Small" ? -20 : size === "Large" ? 20 : 0;
};

Cafe.itemPrice = function (item, size) {
  return item.hasSize ? item.price + Cafe.sizeAdj(size) : item.price;
};
