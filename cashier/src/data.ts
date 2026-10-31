import type { Order, MenuItem } from "./types";

const t = (subtotal: number) => ({ subtotal, total: subtotal });

const ago = (mins: number) => new Date(Date.now() - mins * 60_000);

export const SEED_ORDERS: Order[] = [
  {
    id: 186,
    customer: "Maya R.",
    type: "Dine In",
    items: [
      { name: "Salted Caramel Latte", qty: 1, variant: "Medium · 75% Sugar · Hot", unitPrice: 190 },
      { name: "Avocado Sourdough Toast", qty: 1, unitPrice: 160 },
    ],
    ...t(350),
    status: "new",
    createdAt: ago(3),
  },
  {
    id: 187,
    customer: "Ben C.",
    type: "Dine In",
    items: [
      { name: "Spanish Latte", qty: 1, variant: "Large · 50% Sugar · Cold", unitPrice: 200 },
      { name: "Butter Croissant", qty: 1, unitPrice: 170 },
    ],
    ...t(370),
    status: "new",
    createdAt: ago(1),
  },
  {
    id: 185,
    customer: "Liam T.",
    type: "Take Out",
    items: [
      { name: "Salted Caramel Latte", qty: 2, variant: "Medium · 50% Sugar · Cold", unitPrice: 190 },
      { name: "Pistachio Rose Croissant", qty: 1, unitPrice: 260 },
    ],
    ...t(640),
    status: "preparing",
    createdAt: ago(8),
  },
  {
    id: 184,
    customer: "Nina P.",
    type: "Dine In",
    items: [
      { name: "Salted Caramel Latte", qty: 2, variant: "Medium · 75% Sugar · Hot", unitPrice: 190 },
      { name: "Pistachio Rose Croissant", qty: 1, unitPrice: 260 },
    ],
    ...t(640),
    status: "ready",
    note: "Please serve coffee first. Deliver croissant warmed up later.",
    createdAt: ago(12),
  },
  {
    id: 183,
    customer: "Omar S.",
    type: "Take Out",
    items: [
      { name: "Espresso Double Shot", qty: 1, variant: "Small · 0% Sugar · Hot", unitPrice: 100 },
      { name: "Butter Croissant", qty: 1, unitPrice: 170 },
    ],
    ...t(270),
    status: "completed",
    createdAt: ago(15),
    completedAt: ago(14),
    paymentMethod: "cash",
  },
  {
    id: 182,
    customer: "Sam K.",
    type: "Dine In",
    items: [
      { name: "Iced Matcha Latte", qty: 1, variant: "Large · 25% Sugar · Cold", unitPrice: 179 },
      { name: "Almond Croissant", qty: 1, unitPrice: 160 },
    ],
    ...t(339),
    status: "completed",
    createdAt: ago(35),
    completedAt: ago(33),
    paymentMethod: "gcash",
  },
  {
    id: 181,
    customer: "Aria M.",
    type: "Dine In",
    items: [
      { name: "Cold Brew", qty: 2, variant: "Medium · 0% Sugar · Cold", unitPrice: 160 },
      { name: "Pain Au Chocolat", qty: 2, unitPrice: 110 },
    ],
    ...t(540),
    status: "declined",
    createdAt: ago(60),
    declineReason: "Kitchen Closing",
  },
  {
    id: 180,
    customer: "Ray P.",
    type: "Take Out",
    items: [
      { name: "Flat White", qty: 1, variant: "Medium · 50% Sugar · Hot", unitPrice: 160 },
      { name: "Almond Croissant", qty: 1, unitPrice: 160 },
    ],
    ...t(320),
    status: "completed",
    createdAt: ago(90),
    completedAt: ago(88),
    paymentMethod: "cash",
  },
  {
    id: 179,
    customer: "Leo T.",
    type: "Dine In",
    items: [{ name: "Iced Matcha Latte", qty: 1, variant: "Medium · 25% Sugar · Cold", unitPrice: 159 }],
    ...t(159),
    status: "declined",
    createdAt: ago(22),
    declineReason: "Out of Stock",
  },
];

// ── Full menu synced with customer website ────────────────────────────────────
// Size pricing: Small = base − ₱20, Medium = base, Large = base + ₱20
// tempOptions: "both" = Hot & Cold selector shown; "hot-only" / "cold-only" = selector hidden

export const MENU_ITEMS: MenuItem[] = [
  // ── Coffee ──────────────────────────────────────────────────────────────────
  {
    id: 1,
    name: "Salted Caramel Latte",
    description: "Espresso with house-made salted caramel sauce and steamed milk. Sweet, salty, smooth.",
    category: "Coffee",
    price: 190,
    image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "both",
  },
  {
    id: 2,
    name: "Spanish Latte",
    description: "Espresso pulled over sweetened condensed milk and topped with fresh steamed dairy.",
    category: "Coffee",
    price: 180,
    image: "https://images.unsplash.com/photo-1502462041640-b3d7e50d0662?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "both",
  },
  {
    id: 3,
    name: "Caramel Macchiato",
    description: "Vanilla-infused steamed milk, espresso, and a lattice of house caramel on top.",
    category: "Coffee",
    price: 185,
    image: "https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "both",
  },
  {
    id: 4,
    name: "Mocha Latte",
    description: "Double espresso blended with dark Belgian chocolate and velvety steamed milk.",
    category: "Coffee",
    price: 175,
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "both",
  },
  {
    id: 5,
    name: "Flat White",
    description: "Two ristretto shots with micro-foamed milk. Clean, intense, and beautifully balanced.",
    category: "Coffee",
    price: 160,
    image: "https://images.unsplash.com/photo-1506372023823-741c83b836fe?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "both",
  },
  {
    id: 6,
    name: "Espresso Double Shot",
    description: "Two concentrated shots of single-origin espresso. Direct, bold, no distractions.",
    category: "Coffee",
    price: 120,
    image: "https://images.unsplash.com/photo-1616388761741-a5936c6f61f6?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "hot-only",
  },

  // ── Non-Coffee ───────────────────────────────────────────────────────────────
  {
    id: 7,
    name: "Iced Matcha Latte",
    description: "Ceremonial-grade Japanese matcha shaken with oat milk over cold-pressed ice.",
    category: "Non-Coffee",
    price: 159,
    image: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "cold-only",
  },
  {
    id: 8,
    name: "Cold Brew",
    description: "18-hour slow-steeped single-origin cold brew. Smooth, low-acid, never bitter.",
    category: "Non-Coffee",
    price: 160,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "cold-only",
  },
  {
    id: 9,
    name: "Chocolate Latte",
    description: "Dark Belgian cocoa stirred into steamed whole milk. Rich, comforting, indulgent.",
    category: "Non-Coffee",
    price: 170,
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "both",
  },
  {
    id: 10,
    name: "Ube Latte",
    description: "House-made ube halaya syrup blended with steamed oat milk. Creamy and subtly sweet.",
    category: "Non-Coffee",
    price: 175,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "both",
  },
  {
    id: 11,
    name: "Strawberry Milk",
    description: "Fresh strawberry purée swirled into chilled whole milk. Light, fruity, refreshing.",
    category: "Non-Coffee",
    price: 155,
    image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=500&h=400&fit=crop&auto=format",
    isDrink: true,
    tempOptions: "cold-only",
  },

  // ── Pastries ─────────────────────────────────────────────────────────────────
  {
    id: 12,
    name: "Pistachio Rose Croissant",
    description: "Laminated croissant filled with rose-pistachio frangipane, dusted with crushed pistachios.",
    category: "Pastries",
    price: 260,
    image: "https://images.unsplash.com/photo-1623334044303-241021148842?w=500&h=400&fit=crop&auto=format",
    isDrink: false,
  },
  {
    id: 13,
    name: "Butter Croissant",
    description: "Classic French-style laminated croissant. Shatteringly crisp outside, pillowy within.",
    category: "Pastries",
    price: 170,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&h=400&fit=crop&auto=format",
    isDrink: false,
  },
  {
    id: 14,
    name: "Almond Croissant",
    description: "Day-old croissant soaked in syrup, filled and coated with almond frangipane, baked golden.",
    category: "Pastries",
    price: 160,
    image: "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=500&h=400&fit=crop&auto=format",
    isDrink: false,
  },
  {
    id: 15,
    name: "Blueberry Cream Cheese Danish",
    description: "Flaky pastry with whipped cream cheese and blueberry compote. Delicate and lightly sweet.",
    category: "Pastries",
    price: 78,
    image: "https://images.unsplash.com/photo-1599940778173-e276d4acb2bb?w=500&h=400&fit=crop&auto=format",
    isDrink: false,
  },
  {
    id: 16,
    name: "Pain Au Chocolat",
    description: "Buttery laminated dough wrapped around two dark chocolate batons. Baked fresh each morning.",
    category: "Pastries",
    price: 110,
    image: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=500&h=400&fit=crop&auto=format",
    isDrink: false,
  },
];

export const fmt = (n: number) =>
  "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

export function fmtTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Size price adjustments (drinks only)
export const SIZE_ADJUSTMENTS: Record<string, number> = {
  Small: -20,
  Medium: 0,
  Large: 20,
};
