import { useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = "splash" | "menu" | "item-detail" | "cart" | "confirmation" | "declined";
type Category = "Coffee" | "Non-Coffee" | "Pastries";
type Size = "Small" | "Medium" | "Large";
type SugarLevel = "0%" | "25%" | "50%" | "75%" | "100%";
type Serve = "Hot" | "Cold";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  popular?: boolean;
  hasSize: boolean;
  hasSugar: boolean;
  hasServe: boolean;
}

interface CartItem {
  cartId: string;
  item: MenuItem;
  size: Size;
  sugarLevel: SugarLevel;
  serve: Serve;
  qty: number;
}

interface PlacedOrder {
  orderNum: string;
  name: string;
  orderType: "Dine In" | "Take Out";
  items: CartItem[];
  subtotal: number;
  total: number;
}

// ─── Data ────────────────────────────────────────────────────────────────────

function fmtPrice(n: number) { return `₱${n}`; }
function fmtCalc(n: number)  { return `₱${n.toFixed(2)}`; }
function sizeAdj(s: Size): number { return s === "Small" ? -20 : s === "Large" ? 20 : 0; }
function itemPrice(item: MenuItem, s: Size): number { return item.hasSize ? item.price + sizeAdj(s) : item.price; }

const SIZES: Size[]       = ["Small", "Medium", "Large"];
const SUGAR_LEVELS: SugarLevel[] = ["0%", "25%", "50%", "75%", "100%"];
const CATEGORIES: Category[]     = ["Coffee", "Non-Coffee", "Pastries"];
const SECTION_LABEL: Record<Category, string> = {
  Coffee: "Full Coffee Menu",
  "Non-Coffee": "Matcha, Teas & More",
  Pastries: "Freshly Baked Daily",
};

// ─── Dark-mode palette tokens ─────────────────────────────────────────────────
const C = {
  bg:          "#111113",
  bgCard:      "#1E1E20",
  bgElevated:  "#252527",
  bgWarm:      "#2A1510",
  bgWarmBorder:"#3D2218",
  text:        "#F2F2F2",
  textSub:     "#8E8E93",
  border:      "#333335",
  accent:      "#C8502A",
  accentLight: "#E0724E",
  white:       "#FFFFFF",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <div
      className="menu-item-card rounded-2xl flex gap-3 p-3 cursor-pointer active:opacity-75 transition-opacity duration-100"
      style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}` }}
      onClick={onAdd}
    >
      <img
        src={item.image} alt={item.name}
        className="w-[72px] h-[72px] rounded-xl object-cover flex-shrink-0"
        style={{ backgroundColor: C.bgElevated }}
      />
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <p className="text-[14px] font-bold leading-snug" style={{ color: C.text }}>{item.name}</p>
          <p className="text-[12px] mt-0.5 leading-snug line-clamp-2" style={{ color: C.textSub }}>{item.description}</p>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[14px] font-bold" style={{ color: C.accent }}>{fmtPrice(item.price)}</span>
          <button
            className="rounded-full px-3 py-1 text-[12px] font-semibold transition-colors duration-150 hover:opacity-80"
            style={{ border: `1px solid ${C.border}`, color: C.text, backgroundColor: C.bgElevated }}
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150"
      style={active
        ? { backgroundColor: C.accent, color: C.white, border: `1px solid ${C.accent}` }
        : { backgroundColor: C.bgCard, color: C.text, border: `1px solid ${C.border}` }
      }
    >
      {label}
    </button>
  );
}

function ServePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-7 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150"
      style={active
        ? { backgroundColor: C.accent, color: C.white, border: `1px solid ${C.accent}` }
        : { backgroundColor: C.bgCard, color: C.text, border: `1px solid ${C.border}` }
      }
    >
      {label}
    </button>
  );
}

function Stepper({ value, onDec, onInc, small }: { value: number; onDec: () => void; onInc: () => void; small?: boolean }) {
  const sz = small ? "w-7 h-7 text-[13px]" : "w-8 h-8 text-[16px]";
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onDec}
        className={`${sz} rounded-full flex items-center justify-center font-medium transition-opacity duration-100 active:opacity-60`}
        style={{ border: `1px solid ${C.border}`, color: C.text, backgroundColor: C.bgCard }}
      >−</button>
      <span className="text-[14px] font-semibold w-4 text-center" style={{ color: C.text }}>{value}</span>
      <button
        onClick={onInc}
        className={`${sz} rounded-full flex items-center justify-center font-medium transition-opacity duration-100 active:opacity-70`}
        style={{ backgroundColor: C.accent, color: C.white }}
      >+</button>
    </div>
  );
}

// Animated screen wrapper — re-mounts with fresh animation key on each screen change
function ScreenWrap({ children, animation = "screen-enter", className = "" }: { children: React.ReactNode; animation?: string; className?: string }) {
  return (
    <div
      className={`app-shell flex flex-col ${animation} ${className}`}
      style={{ backgroundColor: C.bg, fontFamily: "'Inter', sans-serif", overflow: "hidden" }}
    >
      {children}
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [screenKey, setScreenKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState<Category>("Coffee");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Menu from the API
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  useEffect(() => {
    fetch("/cafe/api/menu.php")
      .then((res) => {
        if (!res.ok) throw new Error("Bad response");
        return res.json();
      })
      .then((data: MenuItem[]) => {
        setMenu(data);
        setMenuLoading(false);
      })
      .catch(() => {
        setMenuError("We couldn't load the menu. Please ask the staff for help.");
        setMenuLoading(false);
      });
  }, []);

  // Item detail
  const [size, setSize] = useState<Size>("Medium");
  const [sugarLevel, setSugarLevel] = useState<SugarLevel>("50%");
  const [serve, setServe] = useState<Serve>("Hot");
  const [qty, setQty] = useState(1);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"Dine In" | "Take Out">("Dine In");
  const [customerName, setCustomerName] = useState("");
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  // Trigger re-animation on every screen transition
  function goTo(s: Screen) {
    setScreen(s);
    setScreenKey((k) => k + 1);
  }

  const filteredItems = menu.filter((m) => m.category === activeCategory);
  const popularItems  = filteredItems.filter((m) => m.popular);
  const fullItems     = filteredItems.filter((m) => !m.popular);

  const cartCount    = cart.reduce((s, ci) => s + ci.qty, 0);
  const cartSubtotal = cart.reduce((s, ci) => s + itemPrice(ci.item, ci.size) * ci.qty, 0);
  const cartTotal    = cartSubtotal;

  function openItem(item: MenuItem) {
    setSelectedItem(item);
    setSize("Medium");
    setSugarLevel("50%");
    setServe("Hot");
    setQty(1);
    goTo("item-detail");
  }

  function addToCart() {
    if (!selectedItem) return;
    const match = cart.find(
      (ci) => ci.item.id === selectedItem.id && ci.size === size && ci.sugarLevel === sugarLevel && ci.serve === serve
    );
    if (match) {
      setCart(cart.map((ci) => ci === match ? { ...ci, qty: ci.qty + qty } : ci));
    } else {
      setCart([...cart, { cartId: `${selectedItem.id}-${Date.now()}`, item: selectedItem, size, sugarLevel, serve, qty }]);
    }
    goTo("menu");
  }

  function updateQty(cartId: string, delta: number) {
    setCart((p) => p.map((ci) => ci.cartId === cartId ? { ...ci, qty: Math.max(1, ci.qty + delta) } : ci));
  }

  function removeItem(cartId: string) {
    setCart((p) => p.filter((ci) => ci.cartId !== cartId));
  }

  function submitOrder(declined = false) {
    const order: PlacedOrder = {
      orderNum: String(Math.floor(100 + Math.random() * 900)),
      name: customerName.trim(),
      orderType,
      items: [...cart],
      subtotal: cartSubtotal,
      total: cartTotal,
    };
    setPlacedOrder(order);
    setCart([]);
    setCustomerName("");
    goTo(declined ? "declined" : "confirmation");
  }

  function getItemPrice(ci: CartItem) { return itemPrice(ci.item, ci.size); }

  function getVariantText(ci: CartItem) {
    const parts: string[] = [];
    if (ci.item.hasSize)  parts.push(ci.size);
    if (ci.item.hasSugar) parts.push(ci.sugarLevel);
    if (ci.item.hasServe) parts.push(ci.serve);
    return parts.length > 0 ? parts.join(" • ") : "Warmed";
  }

  const canPlace = customerName.trim().length > 0 && cart.length > 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // SPLASH
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "splash") return (
    <div
      key={screenKey}
      className="app-shell splash-shell screen-enter"
      style={{ fontFamily: "'Inter', sans-serif", overflow: "hidden", position: "relative", backgroundColor: C.bg }}
    >
      {/* Full-bleed image */}
      <img
        src="https://images.unsplash.com/photo-1762657440603-67275ae3f7f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1800"
        alt="Barista pouring milk into a cup of coffee"
        className="splash-image absolute inset-0 w-full h-full object-cover"
      />

      {/* Layered contrast for readable content at every viewport */}
      <div className="splash-overlay absolute inset-0" />

      {/* Top: logo mark + wordmark */}
      <div className="splash-top absolute top-0 left-0 right-0 flex items-center gap-3 px-6 pt-12">
        {/* SVG logo mark — stylised Q with a coffee steam curl */}
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="18" fill={C.accent} />
          {/* Cup outline */}
          <path d="M11 16h14l-2 8H13l-2-8Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
          {/* Handle */}
          <path d="M25 18.5c2 0 3 1 3 2.5s-1 2.5-3 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          {/* Steam lines */}
          <path d="M15 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M18 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M21 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <div>
          <p className="text-[17px] font-bold leading-none" style={{ color: C.white, letterSpacing: "-0.01em" }}>QR Cafe</p>
          <p className="text-[10px] font-medium mt-0.5 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Specialty Coffee</p>
        </div>
      </div>

      {/* Bottom: headline + CTA */}
      <div className="splash-content absolute left-0 right-0 px-6">
        <div className="splash-eyebrow flex items-center gap-2.5 mb-4">
          <span className="block w-8 h-px" style={{ backgroundColor: C.accent }} />
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: C.accentLight }}>Freshly made for you</p>
        </div>
        <h1 className="splash-title font-extrabold leading-[1.02] mb-4" style={{ color: C.white, letterSpacing: "-0.04em" }}>
          Slow coffee.<br />Good moments.
        </h1>
        <p className="splash-description text-[14px] leading-relaxed mb-7" style={{ color: "rgba(242,242,242,0.72)" }}>
          Specialty drinks and freshly baked pastries, thoughtfully prepared when you order.
        </p>

        <button
          onClick={() => goTo("menu")}
          className="splash-cta w-full py-[15px] px-6 rounded-2xl text-[15px] font-bold tracking-tight transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
          style={{ backgroundColor: C.accent, color: C.white }}
        >
          Order Now
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 12h14m-5-5 5 5-5 5" />
          </svg>
        </button>

        <div className="splash-services flex items-center justify-center gap-3 mt-5">
          {["Dine In", "Take Out", "Table Service"].map((t, i) => (
            <span key={t} className="flex items-center gap-3">
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{t}</span>
              {i < 2 && <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "inline-block" }} />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // MENU
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "menu") return (
    <ScreenWrap key={screenKey} className="menu-shell">
      {/* Header */}
      <div className="menu-header flex-shrink-0 px-4 pt-5 pb-3" style={{ backgroundColor: C.accent }}>
        <div className="flex items-center gap-2.5 mb-4">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <circle cx="18" cy="18" r="18" fill="rgba(0,0,0,0.2)" />
              <path d="M11 16h14l-2 8H13l-2-8Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
              <path d="M25 18.5c2 0 3 1 3 2.5s-1 2.5-3 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <path d="M15 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M18 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M21 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          <span className="text-[17px] font-bold" style={{ color: C.white }}>Ordering System</span>
        </div>
        {/* Category tabs */}
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-1 py-2 rounded-full text-[13px] font-semibold transition-all duration-200"
              style={activeCategory === cat
                ? { backgroundColor: C.white, color: C.accent, border: `1px solid ${C.white}` }
                : { backgroundColor: "rgba(255,255,255,0.15)", color: C.white, border: "1px solid rgba(255,255,255,0.35)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable items */}
      <div className="menu-scroll flex-1 overflow-y-auto px-4 pb-4">
        {menuLoading && (
          <p className="text-[14px] py-10 text-center" style={{ color: C.textSub }}>Loading menu...</p>
        )}
        {menuError && (
          <p className="text-[14px] py-10 text-center" style={{ color: C.accent }}>{menuError}</p>
        )}
        {popularItems.length > 0 && (
          <>
            <h2 className="text-[17px] font-bold mt-1 mb-3" style={{ color: C.text }}>Popular Choices</h2>
            <div className="menu-card-grid">
              {popularItems.map((item) => <MenuItemCard key={item.id} item={item} onAdd={() => openItem(item)} />)}
            </div>
          </>
        )}
        {fullItems.length > 0 && (
          <>
            <h2 className="text-[17px] font-bold mt-5 mb-3" style={{ color: C.text }}>{SECTION_LABEL[activeCategory]}</h2>
            <div className="menu-card-grid">
              {fullItems.map((item) => <MenuItemCard key={item.id} item={item} onAdd={() => openItem(item)} />)}
            </div>
          </>
        )}
        {!menuLoading && !menuError && filteredItems.length === 0 && (
          <p className="py-8 text-center text-[14px]" style={{ color: C.textSub }}>No items available in this category.</p>
        )}
      </div>

      {/* Bottom cart bar */}
      <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.bg }}>
        <div className="bottom-bar-inner flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: C.accent }}>
              <span className="text-[12px] font-bold" style={{ color: C.white }}>{cartCount}</span>
            </div>
            <span className="text-[14px] font-medium" style={{ color: C.text }}>Items in Cart</span>
          </div>
          <button
            onClick={() => goTo("cart")}
            className="flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-full transition-opacity duration-150 hover:opacity-85"
            style={{ backgroundColor: C.accent, color: C.white }}
          >
            View Cart
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </ScreenWrap>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM DETAIL
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "item-detail" && selectedItem) {
    const unitPrice = itemPrice(selectedItem, size);
    const subtotal = unitPrice * qty;
    return (
      <div
        key={screenKey}
        className="app-shell detail-shell flex flex-col screen-slide-up"
        style={{ backgroundColor: "#1A1A1C", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}
      >
        <div className="detail-main">
        {/* Hero */}
        <div className="detail-hero relative flex-shrink-0" style={{ backgroundColor: C.bgElevated }}>
          <img
            src={selectedItem.image} alt={selectedItem.name}
            className="detail-image w-full object-cover rounded-b-[24px]"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 rounded-b-[24px]" style={{ background: "linear-gradient(to top, rgba(26,26,28,0.5), transparent)" }} />
          <button
            onClick={() => goTo("menu")}
            className="absolute top-5 left-4 w-9 h-9 rounded-full flex items-center justify-center transition-opacity duration-150 hover:opacity-80"
            style={{ backgroundColor: "rgba(30,30,32,0.85)", backdropFilter: "blur(8px)" }}
          >
            <svg className="w-5 h-5" style={{ color: C.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="detail-content flex-1 overflow-y-auto px-4 pt-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-[22px] font-bold leading-tight flex-1" style={{ color: C.text }}>{selectedItem.name}</h1>
            <span className="text-[22px] font-bold whitespace-nowrap" style={{ color: C.accent }}>{fmtPrice(unitPrice)}</span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: C.textSub }}>{selectedItem.description}</p>

          <div className="h-px mt-4 mb-4" style={{ backgroundColor: C.border }} />

          {selectedItem.hasSize && (
            <div className="mb-4">
              <p className="text-[14px] font-bold mb-2.5" style={{ color: C.text }}>Size</p>
              <div className="flex gap-2">
                {SIZES.map((s) => <OptionPill key={s} label={s} active={size === s} onClick={() => setSize(s)} />)}
              </div>
            </div>
          )}

          {selectedItem.hasSugar && (
            <div className="mb-4">
              <p className="text-[14px] font-bold mb-2.5" style={{ color: C.text }}>Sugar Level</p>
              <div className="flex gap-1.5">
                {SUGAR_LEVELS.map((s) => <OptionPill key={s} label={s} active={sugarLevel === s} onClick={() => setSugarLevel(s)} />)}
              </div>
            </div>
          )}

          {selectedItem.hasServe && (
            <div className="mb-4">
              <p className="text-[14px] font-bold mb-2.5" style={{ color: C.text }}>Serve</p>
              <div className="flex gap-2">
                {(["Hot", "Cold"] as Serve[]).map((s) => (
                  <ServePill key={s} label={s} active={serve === s} onClick={() => setServe(s)} />
                ))}
              </div>
            </div>
          )}

          <div className="h-px mb-4" style={{ backgroundColor: C.border }} />

          <div className="flex items-center justify-between pb-4">
            <p className="text-[14px] font-bold" style={{ color: C.text }}>Select Quantity</p>
            <Stepper value={qty} onDec={() => setQty(Math.max(1, qty - 1))} onInc={() => setQty(qty + 1)} />
          </div>
        </div>
        </div>

        {/* Bottom bar */}
        <div className="flex-shrink-0 px-4 py-4" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.bgCard }}>
          <div className="bottom-bar-inner flex items-center justify-between">
            <div>
              <p className="text-[11px]" style={{ color: C.textSub }}>Cart Subtotal</p>
              <p className="text-[18px] font-bold" style={{ color: C.text }}>{fmtPrice(subtotal)}</p>
            </div>
            <button
              onClick={addToCart}
              className="text-[14px] font-bold px-8 py-3.5 rounded-full transition-opacity duration-150 hover:opacity-85 active:opacity-70"
              style={{ backgroundColor: C.accent, color: C.white }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CART
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "cart") return (
    <ScreenWrap key={screenKey} className="cart-shell">
      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <button
          onClick={() => goTo("menu")}
          className="w-9 h-9 rounded-full flex items-center justify-center mb-4 transition-opacity duration-150 hover:opacity-70"
          style={{ backgroundColor: C.bgCard }}
        >
          <svg className="w-5 h-5" style={{ color: C.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[24px] font-bold" style={{ color: C.text }}>Your Order</h1>
        <p className="text-[13px] mt-0.5" style={{ color: C.textSub }}>Review and confirm your table order</p>
      </div>

      <div className="cart-content flex-1 overflow-y-auto px-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[15px] font-semibold mb-1" style={{ color: C.text }}>Your cart is empty</p>
            <button onClick={() => goTo("menu")} className="text-[13px] font-semibold mt-2 transition-opacity hover:opacity-75" style={{ color: C.accent }}>
              Browse Menu →
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items-grid mb-5">
              {cart.map((ci) => {
                const truncated = ci.item.name.length > 18 ? ci.item.name.slice(0, 18) + "..." : ci.item.name;
                return (
                  <div key={ci.cartId} className="rounded-2xl p-3 flex gap-3" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}` }}>
                    <img src={ci.item.image} alt={ci.item.name} className="w-[68px] h-[68px] rounded-xl object-cover flex-shrink-0" style={{ backgroundColor: C.bgElevated }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-[14px] font-bold" style={{ color: C.text }}>{truncated}</p>
                        <button onClick={() => removeItem(ci.cartId)} className="flex-shrink-0 ml-1 transition-opacity hover:opacity-70">
                          <svg className="w-[18px] h-[18px]" style={{ color: C.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-[12px] mt-0.5" style={{ color: C.textSub }}>{getVariantText(ci)}</p>
                      <p className="text-[13px] font-bold mt-0.5" style={{ color: C.accent }}>{fmtPrice(getItemPrice(ci))}</p>
                      <div className="mt-1.5">
                        <Stepper small value={ci.qty} onDec={() => updateQty(ci.cartId, -1)} onInc={() => updateQty(ci.cartId, 1)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="mb-5 space-y-1.5 text-[14px]">
              <div className="flex justify-between text-[15px] font-bold">
                <span style={{ color: C.text }}>Total</span>
                <span style={{ color: C.accent }}>{fmtCalc(cartTotal)}</span>
              </div>
            </div>

            {/* Name input */}
            <input
              type="text"
              placeholder="Name for your order"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-2xl px-4 py-3.5 text-[14px] focus:outline-none transition-colors duration-150 mb-3"
              style={{
                backgroundColor: C.bgCard,
                border: `1px solid ${customerName ? C.accent : C.border}`,
                color: C.text,
              }}
            />

            {/* Dine In / Take Out */}
            <div className="grid grid-cols-2 gap-2 pb-4">
              {(["Dine In", "Take Out"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className="py-3.5 rounded-full text-[14px] font-bold transition-all duration-150"
                  style={orderType === type
                    ? { backgroundColor: C.accent, color: C.white, border: `1px solid ${C.accent}` }
                    : { backgroundColor: C.bgCard, color: C.text, border: `1px solid ${C.border}` }
                  }
                >
                  {type}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div className="flex-shrink-0 px-4 pb-6 pt-3 space-y-2" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.bg }}>
          <button
            onClick={() => submitOrder(false)}
            disabled={!canPlace}
            className="w-full py-4 rounded-full text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all duration-150"
            style={canPlace
              ? { backgroundColor: C.accent, color: C.white }
              : { backgroundColor: C.bgElevated, color: C.textSub, cursor: "not-allowed" }
            }
          >
            Place Order · {orderType} →
          </button>
          <button
            onClick={() => submitOrder(true)}
            disabled={!canPlace}
            className="w-full py-2.5 rounded-full text-[12px] transition-all duration-150"
            style={{ border: `1px solid ${C.border}`, color: C.textSub, opacity: canPlace ? 1 : 0.3 }}
          >
            Simulate Declined Order (Demo)
          </button>
        </div>
      )}
    </ScreenWrap>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIRMATION
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "confirmation" && placedOrder) return (
    <ScreenWrap key={screenKey} animation="screen-fade" className="status-shell">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill={C.accent} />
              <path d="M11 16h14l-2 8H13l-2-8Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
              <path d="M25 18.5c2 0 3 1 3 2.5s-1 2.5-3 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <path d="M15 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M18 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M21 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          <span className="text-[17px] font-bold" style={{ color: C.text }}>Ordering System</span>
        </div>
        <span
          className="text-[12px] font-semibold px-3 py-1 rounded-full"
          style={{ color: C.accent, backgroundColor: C.bgWarm, border: `1px solid ${C.bgWarmBorder}` }}
        >
          {placedOrder.orderType}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <h1 className="text-[24px] font-bold mb-0.5" style={{ color: C.text }}>Order Received!</h1>
        <p className="text-[13px] mb-6" style={{ color: C.textSub }}>{placedOrder.orderType} • Cafe Order</p>

        {/* Checkmark */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#34C759" }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: C.textSub }}>Your Order Number</p>
          <p className="text-[36px] font-bold leading-none" style={{ color: C.text }}>#{placedOrder.orderNum}</p>
        </div>

        {/* Customer info */}
        <div className="rounded-2xl px-4 py-3 mb-3 space-y-2" style={{ backgroundColor: C.bgWarm, border: `1px solid ${C.bgWarmBorder}` }}>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textSub }}>Customer</span>
            <span className="text-[14px] font-bold" style={{ color: C.text }}>{placedOrder.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textSub }}>Order Type</span>
            <span className="text-[14px] font-bold" style={{ color: C.text }}>{placedOrder.orderType}</span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="rounded-2xl px-4 py-3.5 mb-5" style={{ backgroundColor: C.bgWarm, border: `1px solid ${C.bgWarmBorder}` }}>
          <p className="text-[14px] font-bold mb-2" style={{ color: C.accent }}>Next Steps</p>
          <p className="text-[13px] leading-relaxed mb-1" style={{ color: C.text }}>1. Your drinks &amp; pastries are being prepared fresh now.</p>
          <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>2. Please proceed to the counter to pay. Your order will be sent to the kitchen once payment is confirmed.</p>
        </div>

        {/* Summary */}
        <p className="text-[17px] font-bold mb-3" style={{ color: C.text }}>Summary</p>
        <div className="rounded-2xl px-4 py-3.5 mb-6" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="space-y-2.5 mb-3">
            {placedOrder.items.map((ci) => (
              <div key={ci.cartId} className="flex justify-between text-[13px]">
                <span style={{ color: C.text }}>{ci.qty}x {ci.item.name}</span>
                <span style={{ color: C.text }}>{fmtPrice(itemPrice(ci.item, ci.size) * ci.qty)}</span>
              </div>
            ))}
          </div>
          <div className="pt-2.5 flex justify-between items-center" style={{ borderTop: `1px solid ${C.border}` }}>
            <span className="text-[14px] font-bold" style={{ color: C.text }}>Total to Pay</span>
            <span className="text-[14px] font-bold" style={{ color: C.accent }}>{fmtCalc(placedOrder.total)}</span>
          </div>
        </div>

        <button
          onClick={() => { goTo("menu"); setActiveCategory("Coffee"); }}
          className="w-full py-4 rounded-full text-[14px] font-bold transition-opacity duration-150 hover:opacity-85"
          style={{ backgroundColor: C.accent, color: C.white }}
        >
          Back to Menu
        </button>
      </div>
    </ScreenWrap>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // DECLINED
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "declined" && placedOrder) return (
    <ScreenWrap key={screenKey} animation="screen-fade" className="status-shell">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill={C.accent} />
              <path d="M11 16h14l-2 8H13l-2-8Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
              <path d="M25 18.5c2 0 3 1 3 2.5s-1 2.5-3 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <path d="M15 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M18 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M21 13.5c0-1 1-1.5 1-2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          <span className="text-[17px] font-bold" style={{ color: C.text }}>Ordering System</span>
        </div>
        <span
          className="text-[12px] font-semibold px-3 py-1 rounded-full"
          style={{ color: C.accent, backgroundColor: C.bgWarm, border: `1px solid ${C.bgWarmBorder}` }}
        >
          {placedOrder.orderType}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <h1 className="text-[24px] font-bold mb-0.5" style={{ color: C.text }}>Order Declined</h1>
        <p className="text-[13px] mb-6" style={{ color: C.textSub }}>Order not fulfilled</p>

        {/* X icon */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#7B3428" }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: C.textSub }}>Your Order Number</p>
          <p className="text-[36px] font-bold leading-none" style={{ color: C.text }}>#{placedOrder.orderNum}</p>
        </div>

        {/* Customer info */}
        <div className="rounded-2xl px-4 py-3 mb-3 space-y-2" style={{ backgroundColor: C.bgWarm, border: `1px solid ${C.bgWarmBorder}` }}>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textSub }}>Customer</span>
            <span className="text-[14px] font-bold" style={{ color: C.text }}>{placedOrder.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textSub }}>Order Type</span>
            <span className="text-[14px] font-bold" style={{ color: C.text }}>{placedOrder.orderType}</span>
          </div>
        </div>

        {/* Reason card */}
        <div className="rounded-2xl px-4 py-3.5 mb-5" style={{ backgroundColor: C.bgWarm, border: `1px solid ${C.bgWarmBorder}` }}>
          <p className="text-[14px] font-bold mb-2" style={{ color: C.accent }}>Order Declined</p>
          <p className="text-[13px] leading-relaxed mb-1" style={{ color: C.text }}>We're sorry — the café was unable to fulfill this order.</p>
          <p className="text-[13px] leading-relaxed mb-1" style={{ color: C.text }}>Reason: Kitchen closing for the day.</p>
          <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>No payment has been charged. Please check with the counter if you have questions.</p>
        </div>

        {/* Summary */}
        <p className="text-[17px] font-bold mb-3" style={{ color: C.text }}>Summary</p>
        <div className="rounded-2xl px-4 py-3.5 mb-6" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="space-y-2.5 mb-3">
            {placedOrder.items.map((ci) => (
              <div key={ci.cartId} className="flex justify-between text-[13px]">
                <span style={{ color: C.text }}>{ci.qty}x {ci.item.name}</span>
                <span style={{ color: C.text }}>{fmtPrice(itemPrice(ci.item, ci.size) * ci.qty)}</span>
              </div>
            ))}
          </div>
          <div className="pt-2.5 flex justify-between items-center" style={{ borderTop: `1px solid ${C.border}` }}>
            <span className="text-[14px] font-bold" style={{ color: C.text }}>Order Total (Not Charged)</span>
            <span className="text-[14px] font-bold" style={{ color: C.accent }}>{fmtCalc(placedOrder.total)}</span>
          </div>
        </div>

        <button
          onClick={() => { goTo("menu"); setActiveCategory("Coffee"); }}
          className="w-full py-4 rounded-full text-[14px] font-bold transition-opacity duration-150 hover:opacity-85"
          style={{ backgroundColor: C.accent, color: C.white }}
        >
          Back to Menu
        </button>
      </div>
    </ScreenWrap>
  );

  return null;
}
