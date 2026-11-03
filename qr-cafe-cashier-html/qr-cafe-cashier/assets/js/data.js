/* ==========================================================================
   QR Cafe Cashier – Constants, demo data and pure helpers
   ========================================================================== */
window.Cafe = window.Cafe || {};

/* ---- Constants --------------------------------------------------------- */
Cafe.CATEGORIES = ["Coffee", "Non-Coffee", "Pastries"];
Cafe.SIZES = ["Small", "Medium", "Large"];
Cafe.SUGAR_LEVELS = ["0%", "25%", "50%", "75%", "100%"];
Cafe.FULFILLMENT = ["Dine In", "Take Out"];
Cafe.DISCOUNT_TYPES = ["PWD", "Senior Citizen", "Student"];
Cafe.DECLINE_REASONS = ["Out of Stock", "Kitchen Closing", "Other"];

/* Business rules (the server must enforce these too). */
Cafe.DISCOUNT_RATE = 0.2;                                  /* 20% */
Cafe.SIZE_ADJUSTMENTS = { Small: -20, Medium: 0, Large: 20 };  /* drinks only, ₱ */

/* ---- Menu (synced with the customer website in the original) ---------- */
/* tempOptions: "both" | "hot-only" | "cold-only" (drinks only) */
Cafe.MENU_ITEMS = [
  { id: 1,  name: "Salted Caramel Latte", category: "Coffee", price: 190, isDrink: true, tempOptions: "both",
    description: "Espresso with house-made salted caramel sauce and steamed milk. Sweet, salty, smooth.",
    image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&h=400&fit=crop&auto=format" },
  { id: 2,  name: "Spanish Latte", category: "Coffee", price: 180, isDrink: true, tempOptions: "both",
    description: "Espresso pulled over sweetened condensed milk and topped with fresh steamed dairy.",
    image: "https://images.unsplash.com/photo-1502462041640-b3d7e50d0662?w=500&h=400&fit=crop&auto=format" },
  { id: 3,  name: "Caramel Macchiato", category: "Coffee", price: 185, isDrink: true, tempOptions: "both",
    description: "Vanilla-infused steamed milk, espresso, and a lattice of house caramel on top.",
    image: "https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?w=500&h=400&fit=crop&auto=format" },
  { id: 4,  name: "Mocha Latte", category: "Coffee", price: 175, isDrink: true, tempOptions: "both",
    description: "Double espresso blended with dark Belgian chocolate and velvety steamed milk.",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&h=400&fit=crop&auto=format" },
  { id: 5,  name: "Flat White", category: "Coffee", price: 160, isDrink: true, tempOptions: "both",
    description: "Two ristretto shots with micro-foamed milk. Clean, intense, and beautifully balanced.",
    image: "https://images.unsplash.com/photo-1506372023823-741c83b836fe?w=500&h=400&fit=crop&auto=format" },
  { id: 6,  name: "Espresso Double Shot", category: "Coffee", price: 120, isDrink: true, tempOptions: "hot-only",
    description: "Two concentrated shots of single-origin espresso. Direct, bold, no distractions.",
    image: "https://images.unsplash.com/photo-1616388761741-a5936c6f61f6?w=500&h=400&fit=crop&auto=format" },

  { id: 7,  name: "Iced Matcha Latte", category: "Non-Coffee", price: 159, isDrink: true, tempOptions: "cold-only",
    description: "Ceremonial-grade Japanese matcha shaken with oat milk over cold-pressed ice.",
    image: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=500&h=400&fit=crop&auto=format" },
  { id: 8,  name: "Cold Brew", category: "Non-Coffee", price: 160, isDrink: true, tempOptions: "cold-only",
    description: "18-hour slow-steeped single-origin cold brew. Smooth, low-acid, never bitter.",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=400&fit=crop&auto=format" },
  { id: 9,  name: "Chocolate Latte", category: "Non-Coffee", price: 170, isDrink: true, tempOptions: "both",
    description: "Dark Belgian cocoa stirred into steamed whole milk. Rich, comforting, indulgent.",
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&h=400&fit=crop&auto=format" },
  { id: 10, name: "Ube Latte", category: "Non-Coffee", price: 175, isDrink: true, tempOptions: "both",
    description: "House-made ube halaya syrup blended with steamed oat milk. Creamy and subtly sweet.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=400&fit=crop&auto=format" },
  { id: 11, name: "Strawberry Milk", category: "Non-Coffee", price: 155, isDrink: true, tempOptions: "cold-only",
    description: "Fresh strawberry purée swirled into chilled whole milk. Light, fruity, refreshing.",
    image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=500&h=400&fit=crop&auto=format" },

  { id: 12, name: "Pistachio Rose Croissant", category: "Pastries", price: 260, isDrink: false,
    description: "Laminated croissant filled with rose-pistachio frangipane, dusted with crushed pistachios.",
    image: "https://images.unsplash.com/photo-1623334044303-241021148842?w=500&h=400&fit=crop&auto=format" },
  { id: 13, name: "Butter Croissant", category: "Pastries", price: 170, isDrink: false,
    description: "Classic French-style laminated croissant. Shatteringly crisp outside, pillowy within.",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&h=400&fit=crop&auto=format" },
  { id: 14, name: "Almond Croissant", category: "Pastries", price: 160, isDrink: false,
    description: "Day-old croissant soaked in syrup, filled and coated with almond frangipane, baked golden.",
    image: "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=500&h=400&fit=crop&auto=format" },
  { id: 15, name: "Blueberry Cream Cheese Danish", category: "Pastries", price: 78, isDrink: false,
    description: "Flaky pastry with whipped cream cheese and blueberry compote. Delicate and lightly sweet.",
    image: "https://images.unsplash.com/photo-1599940778173-e276d4acb2bb?w=500&h=400&fit=crop&auto=format" },
  { id: 16, name: "Pain Au Chocolat", category: "Pastries", price: 110, isDrink: false,
    description: "Buttery laminated dough wrapped around two dark chocolate batons. Baked fresh each morning.",
    image: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=500&h=400&fit=crop&auto=format" }
];

Cafe.menuById = function (id) {
  return Cafe.MENU_ITEMS.find(function (m) { return m.id === Number(id); }) || null;
};

/* ---- Demo orders (relative timestamps, built fresh each time) --------- */
Cafe.seedOrders = function () {
  function ago(mins) { return new Date(Date.now() - mins * 60000); }
  function o(id, customer, type, items, status, mins, extra) {
    var subtotal = items.reduce(function (s, i) { return s + i.unitPrice * i.qty; }, 0);
    return Object.assign({
      id: id, customer: customer, type: type, items: items,
      subtotal: subtotal, total: subtotal, status: status, createdAt: ago(mins)
    }, extra || {});
  }
  return [
    o(186, "Maya R.", "Dine In", [
      { name: "Salted Caramel Latte", qty: 1, variant: "Medium · 75% Sugar · Hot", unitPrice: 190 },
      { name: "Avocado Sourdough Toast", qty: 1, unitPrice: 160 }], "new", 3),
    o(187, "Ben C.", "Dine In", [
      { name: "Spanish Latte", qty: 1, variant: "Large · 50% Sugar · Cold", unitPrice: 200 },
      { name: "Butter Croissant", qty: 1, unitPrice: 170 }], "new", 1),
    o(185, "Liam T.", "Take Out", [
      { name: "Salted Caramel Latte", qty: 2, variant: "Medium · 50% Sugar · Cold", unitPrice: 190 },
      { name: "Pistachio Rose Croissant", qty: 1, unitPrice: 260 }], "preparing", 8),
    o(184, "Nina P.", "Dine In", [
      { name: "Salted Caramel Latte", qty: 2, variant: "Medium · 75% Sugar · Hot", unitPrice: 190 },
      { name: "Pistachio Rose Croissant", qty: 1, unitPrice: 260 }], "ready", 12,
      { note: "Please serve coffee first. Deliver croissant warmed up later." }),
    o(183, "Omar S.", "Take Out", [
      { name: "Espresso Double Shot", qty: 1, variant: "Small · 0% Sugar · Hot", unitPrice: 100 },
      { name: "Butter Croissant", qty: 1, unitPrice: 170 }], "completed", 15,
      { completedAt: ago(14), paymentMethod: "cash" }),
    o(182, "Sam K.", "Dine In", [
      { name: "Iced Matcha Latte", qty: 1, variant: "Large · 25% Sugar · Cold", unitPrice: 179 },
      { name: "Almond Croissant", qty: 1, unitPrice: 160 }], "completed", 35,
      { completedAt: ago(33), paymentMethod: "gcash" }),
    o(181, "Aria M.", "Dine In", [
      { name: "Cold Brew", qty: 2, variant: "Medium · 0% Sugar · Cold", unitPrice: 160 },
      { name: "Pain Au Chocolat", qty: 2, unitPrice: 110 }], "declined", 60,
      { declineReason: "Kitchen Closing" }),
    o(180, "Ray P.", "Take Out", [
      { name: "Flat White", qty: 1, variant: "Medium · 50% Sugar · Hot", unitPrice: 160 },
      { name: "Almond Croissant", qty: 1, unitPrice: 160 }], "completed", 90,
      { completedAt: ago(88), paymentMethod: "cash" }),
    o(179, "Leo T.", "Dine In", [
      { name: "Iced Matcha Latte", qty: 1, variant: "Medium · 25% Sugar · Cold", unitPrice: 159 }], "declined", 22,
      { declineReason: "Out of Stock" })
  ];
};

/* ---- Formatting -------------------------------------------------------- */
/* "#001": the order code the customer sees on their phone (demo orders only have an id) */
Cafe.orderNo = function (order) {
  var no = order.code || order.id;
  return no ? "#" + no : "New order";   /* a walk-in has no number until walkin.php saves it */
};

Cafe.fmt = function (n) {
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

Cafe.timeAgo = function (date) {
  var mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return mins + " mins ago";
  return Math.floor(mins / 60) + "h ago";
};

Cafe.fmtTime = function (date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

Cafe.fmtDate = function (date, month) {
  return date.toLocaleDateString("en-PH", { month: month || "short", day: "numeric", year: "numeric" });
};

/* YYYY-MM-DD in the browser's LOCAL time (toISOString() would shift the day in UTC+8). */
Cafe.toDateInput = function (date) {
  var m = String(date.getMonth() + 1).padStart(2, "0");
  var d = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + m + "-" + d;
};

/* ---- Order / cart helpers --------------------------------------------- */
Cafe.buildVariant = function (size, sugar, temp) {
  var parts = [];
  if (size) parts.push(size);
  if (sugar) parts.push(sugar + " Sugar");
  if (temp) parts.push(temp);
  return parts.join(" · ");
};

Cafe.makeCartKey = function (itemId, size, sugar, temp) {
  return itemId + "_" + (size || "") + "_" + (sugar || "") + "_" + (temp || "");
};

Cafe.roundMoney = function (n) { return Math.round(n * 100) / 100; };

Cafe.discountAmount = function (subtotal, discountType) {
  return discountType ? Cafe.roundMoney(subtotal * Cafe.DISCOUNT_RATE) : 0;
};

/* Turn cart entries into an order draft (status "new", no id yet). */
Cafe.buildOrder = function (customer, type, cart, discountType) {
  var subtotal = cart.reduce(function (s, e) { return s + e.effectivePrice * e.qty; }, 0);
  var discount = discountType ? Cafe.discountAmount(subtotal, discountType) : undefined;
  return {
    customer: customer, type: type,
    items: cart.map(function (e) {
      var item = Cafe.menuById(e.itemId);
      return {
        name: item.name, qty: e.qty, unitPrice: e.effectivePrice,
        variant: item.isDrink ? Cafe.buildVariant(e.size, e.sugarLevel, e.temp) : undefined
      };
    }),
    subtotal: subtotal, discount: discount, discountType: discountType || undefined,
    total: discount ? subtotal - discount : subtotal,
    status: "new", createdAt: new Date()
  };
};
