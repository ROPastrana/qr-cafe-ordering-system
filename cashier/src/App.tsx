import { useState, useEffect, useCallback } from "react";
import type {
  Screen, Order, OrderStatus, FulfillmentType, DeclineReason,
  PaymentMethod, MenuCategory, CartEntry, MenuItem,
  DrinkSize, SugarLevel, DrinkTemp, DiscountType,
} from "./types";
import { MENU_ITEMS, fmt, timeAgo, fmtTime, SIZE_ADJUSTMENTS } from "./data";

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  sidebar: "#2B1810",
  sidebarHover: "#3D2314",
  orange: "#C8481C",
  orangeLight: "#F5E8E2",
  pageBg: "#F5EFE6",
  card: "#FFFFFF",
  border: "#E8E0D5",
  green: "#1A5C3A",
  greenLight: "#E6F4ED",
  blue: "#1565C0",
  blueLight: "#E3EDF9",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B6B6B",
  textMuted: "#9E9E9E",
  red: "#7B2D0F",
};

// ── Utilities ─────────────────────────────────────────────────────────────────
let nextId = 188;

function buildVariantString(size?: DrinkSize, sugarLevel?: SugarLevel, temp?: DrinkTemp): string {
  const parts: string[] = [];
  if (size) parts.push(size);
  if (sugarLevel) parts.push(`${sugarLevel} Sugar`);
  if (temp) parts.push(temp);
  return parts.join(" · ");
}

function makeCartKey(itemId: number, size?: DrinkSize, sugarLevel?: SugarLevel, temp?: DrinkTemp): string {
  return `${itemId}_${size ?? ""}_${sugarLevel ?? ""}_${temp ?? ""}`;
}

function makeOrder(
  customer: string,
  type: FulfillmentType,
  items: CartEntry[],
  note: string,
  discountType?: DiscountType
): Order {
  const subtotal = items.reduce((s, e) => s + e.effectivePrice * e.qty, 0);
  const discount = discountType ? Math.round(subtotal * 0.2 * 100) / 100 : undefined;
  return {
    id: nextId++,
    customer,
    type,
    items: items.map((e) => ({
      name: e.item.name,
      qty: e.qty,
      variant: e.item.isDrink
        ? buildVariantString(e.size, e.sugarLevel, e.temp)
        : undefined,
      unitPrice: e.effectivePrice,
    })),
    subtotal,
    discount,
    discountType,
    total: discount ? subtotal - discount : subtotal,
    status: "new",
    note: note || undefined,
    createdAt: new Date(),
  };
}

const DISCOUNT_RATE = 0.20;

// ── Clock ─────────────────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── Icon components ───────────────────────────────────────────────────────────
const IconQueue = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const IconHistory = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconCoffee = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
);
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const QrCodeSvg = ({ size = 140 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <rect x="10" y="10" width="70" height="70" rx="8" fill="#1C1C1C"/>
    <rect x="20" y="20" width="50" height="50" rx="4" fill="white"/>
    <rect x="28" y="28" width="34" height="34" rx="2" fill="#1C1C1C"/>
    <rect x="120" y="10" width="70" height="70" rx="8" fill="#1C1C1C"/>
    <rect x="130" y="20" width="50" height="50" rx="4" fill="white"/>
    <rect x="138" y="28" width="34" height="34" rx="2" fill="#1C1C1C"/>
    <rect x="10" y="120" width="70" height="70" rx="8" fill="#1C1C1C"/>
    <rect x="20" y="130" width="50" height="50" rx="4" fill="white"/>
    <rect x="28" y="138" width="34" height="34" rx="2" fill="#1C1C1C"/>
    {[90,100,110,90,100,110].map((x, i) => [10,20,30,40,50,60].map((y, j) =>
      (x + y + i + j) % 18 < 9 ? <rect key={`${x}-${y}-${i}`} x={x} y={y} width="8" height="8" rx="1" fill="#1C1C1C"/> : null
    ))}
    {[10,20,30,40,50,60].map((x, i) => [90,100,110,120,130,140].map((y, j) =>
      (x + y + i + j) % 20 < 10 ? <rect key={`d-${x}-${y}`} x={x} y={y} width="8" height="8" rx="1" fill="#1C1C1C"/> : null
    ))}
    {[90,100,110,120,130,140,150,160,170,180].map((x, i) => [90,100,110,120,130,140,150,160,170,180].map((y, j) =>
      (i * 3 + j * 7) % 10 < 5 ? <rect key={`e-${x}-${y}`} x={x} y={y} width="8" height="8" rx="1" fill="#1C1C1C"/> : null
    ))}
  </svg>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface SidebarProps { screen: Screen; onNav: (s: Screen) => void; onLogout: () => void; name: string; }
function Sidebar({ screen, onNav, onLogout, name }: SidebarProps) {
  const navItems: { id: Screen; label: string; icon: React.ReactNode }[] = [
    { id: "queue", label: "Order Queue", icon: <IconQueue /> },
    { id: "manual", label: "Manual Entry", icon: <IconPlus /> },
    { id: "history", label: "Order History", icon: <IconHistory /> },
    { id: "report", label: "Sales Report", icon: <IconChart /> },
  ];
  const active = (s: Screen) =>
    s === screen || (s === "queue" && screen === "workspace") || (s === "manual" && screen === "checkout");

  return (
    <aside className="app-sidebar" style={{ width: 240, minWidth: 240, backgroundColor: C.sidebar, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
      <div className="sidebar-brand" style={{ padding: "20px 16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconCoffee />
          </div>
          <span className="sidebar-brand-name" style={{ color: "white", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", lineHeight: 1.2 }}>
            ORDERING<br />SYSTEM POS
          </span>
        </div>
      </div>
      <nav className="sidebar-nav" style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer",
              backgroundColor: active(item.id) ? C.orange : "transparent",
              color: active(item.id) ? "white" : "rgba(255,255,255,0.65)",
              fontWeight: active(item.id) ? 600 : 400,
              fontSize: 14, transition: "all 0.15s", textAlign: "left", width: "100%",
            }}
            onMouseOver={(e) => { if (!active(item.id)) e.currentTarget.style.backgroundColor = C.sidebarHover; }}
            onMouseOut={(e) => { if (!active(item.id)) e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {item.icon}<span className="sidebar-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-profile" style={{ margin: "0 12px 12px", padding: "12px 14px", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden" }}>
            <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#8B5E3C"/>
              <circle cx="18" cy="14" r="7" fill="#C8966C"/>
              <ellipse cx="18" cy="32" rx="12" ry="9" fill="#6B4226"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 13 }}>{name}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Station 1 · Cashier</div>
          </div>
        </div>
      </div>
      <button
        className="sidebar-logout"
        onClick={onLogout}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 26px 18px", color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
      >
        <IconLogout /> Logout Session
      </button>
    </aside>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
  const now = useClock();
  const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dateStr = `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;
  return (
    <div className="top-bar" style={{ padding: "20px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: C.pageBg }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: "2px 0 0" }}>{subtitle}</p>
      </div>
      <div className="top-bar-clock" style={{ textAlign: "right" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{timeStr}</div>
        <div style={{ fontSize: 12, color: C.textSecondary }}>{dateStr}</div>
      </div>
    </div>
  );
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const isDineIn = type === "Dine In";
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, backgroundColor: isDineIn ? C.orangeLight : C.blueLight, color: isDineIn ? C.orange : C.blue }}>
      {type}
    </span>
  );
}
function StatusPill({ status }: { status: OrderStatus }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    new: { bg: "#FFF3ED", color: C.orange, label: "New" },
    preparing: { bg: C.blueLight, color: C.blue, label: "Preparing" },
    ready: { bg: C.greenLight, color: C.green, label: "Ready" },
    completed: { bg: "#EAFAF1", color: "#1A7A4A", label: "Paid" },
    declined: { bg: "#FFE8E8", color: "#B00020", label: "Declined" },
  };
  const s = map[status] ?? map.new;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 6, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  );
}

// ── Chip selector helper ──────────────────────────────────────────────────────
function ChipGroup<T extends string>({
  options, value, onChange, colorActive,
}: { options: T[]; value: T; onChange: (v: T) => void; colorActive?: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const isActive = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: isActive ? 600 : 400,
              cursor: "pointer", border: `1.5px solid ${isActive ? (colorActive ?? C.orange) : C.border}`,
              backgroundColor: isActive ? (colorActive ?? C.orange) : "white",
              color: isActive ? "white" : C.textPrimary, transition: "all 0.12s",
            }}
          >{opt}</button>
        );
      })}
    </div>
  );
}

// ── Item Customization Modal ──────────────────────────────────────────────────
interface CustomizationModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (entry: CartEntry) => void;
}
function ItemCustomizationModal({ item, onClose, onAddToCart }: CustomizationModalProps) {
  const [size, setSize] = useState<DrinkSize>("Medium");
  const [sugarLevel, setSugarLevel] = useState<SugarLevel>("50%");
  const [temp, setTemp] = useState<DrinkTemp>(
    item.tempOptions === "cold-only" ? "Cold" : "Hot"
  );
  const [qty, setQty] = useState(1);

  const sizeAdj = item.isDrink ? (SIZE_ADJUSTMENTS[size] ?? 0) : 0;
  const effectivePrice = item.price + sizeAdj;
  const lineTotal = effectivePrice * qty;

  const handleAdd = () => {
    const entry: CartEntry = item.isDrink
      ? {
          item,
          qty,
          effectivePrice,
          cartKey: makeCartKey(item.id, size, sugarLevel, temp),
          size,
          sugarLevel,
          temp,
        }
      : {
          item,
          qty,
          effectivePrice: item.price,
          cartKey: makeCartKey(item.id),
        };
    onAddToCart(entry);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel" style={{ backgroundColor: "white", borderRadius: 18, width: 520, maxWidth: "92vw", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
        {/* Item image */}
        <div style={{ position: "relative", height: 200, backgroundColor: "#E8E0D5", flexShrink: 0 }}>
          <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
          >
            <IconX />
          </button>
          <div style={{ position: "absolute", bottom: 14, left: 18, right: 18 }}>
            <h2 style={{ color: "white", fontSize: 20, fontWeight: 700, margin: "0 0 2px", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{item.name}</h2>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: "0 0 20px", lineHeight: 1.6 }}>{item.description}</p>

          {item.isDrink && (
            <>
              {/* Size */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Size</span>
                  <span style={{ fontSize: 12, color: C.textMuted }}>
                    {sizeAdj < 0 ? `−₱${Math.abs(sizeAdj)}` : sizeAdj > 0 ? `+₱${sizeAdj}` : "Base price"}
                  </span>
                </div>
                <ChipGroup<DrinkSize>
                  options={["Small", "Medium", "Large"]}
                  value={size}
                  onChange={setSize}
                />
              </div>

              {/* Sugar Level */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, display: "block", marginBottom: 10 }}>Sugar Level</span>
                <ChipGroup<SugarLevel>
                  options={["0%", "25%", "50%", "75%", "100%"]}
                  value={sugarLevel}
                  onChange={setSugarLevel}
                  colorActive="#8B5E3C"
                />
              </div>

              {/* Hot / Cold — only for "both" */}
              {item.tempOptions === "both" && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, display: "block", marginBottom: 10 }}>Temperature</span>
                  <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1.5px solid ${C.border}`, width: "fit-content" }}>
                    {(["Hot", "Cold"] as DrinkTemp[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTemp(t)}
                        style={{
                          padding: "8px 24px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                          backgroundColor: temp === t ? C.orange : "white",
                          color: temp === t ? "white" : C.textPrimary, transition: "all 0.12s",
                        }}
                      >{t}</button>
                    ))}
                  </div>
                </div>
              )}

              {item.tempOptions !== "both" && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, display: "block", marginBottom: 8 }}>Temperature</span>
                  <span style={{
                    display: "inline-block", padding: "6px 18px", borderRadius: 20,
                    backgroundColor: item.tempOptions === "cold-only" ? C.blueLight : C.orangeLight,
                    color: item.tempOptions === "cold-only" ? C.blue : C.orange,
                    fontSize: 13, fontWeight: 600,
                  }}>
                    {item.tempOptions === "cold-only" ? "Cold Only" : "Hot Only"}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Qty */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Quantity</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.border}`, backgroundColor: "white", fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textPrimary }}>−</button>
              <span style={{ fontSize: 16, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", backgroundColor: C.orange, fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>+</button>
            </div>
          </div>
        </div>

        {/* Add to Cart footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: 12, color: C.textMuted }}>Total</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.orange }}>{fmt(lineTotal)}</div>
          </div>
          <button
            onClick={handleAdd}
            style={{ padding: "12px 32px", borderRadius: 12, border: "none", backgroundColor: C.orange, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Decline Dialog ────────────────────────────────────────────────────────────
interface DeclineDialogProps { orderId: number; onCancel: () => void; onConfirm: (id: number, reason: DeclineReason, note: string) => void; }
function DeclineDialog({ orderId, onCancel, onConfirm }: DeclineDialogProps) {
  const [reason, setReason] = useState<DeclineReason>("Out of Stock");
  const [note, setNote] = useState("");
  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div className="modal-panel" style={{ backgroundColor: "white", borderRadius: 16, padding: "32px", width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Decline Order #{orderId}?</h2>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: "0 0 24px", lineHeight: 1.5 }}>
          Let the kitchen know why this order can't be fulfilled. This will notify the customer.
        </p>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 10px" }}>Reason</p>
          <div style={{ display: "flex", gap: 8 }}>
            {(["Out of Stock", "Kitchen Closing", "Other"] as DeclineReason[]).map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", border: `1.5px solid ${reason === r ? C.orange : C.border}`, backgroundColor: reason === r ? C.orangeLight : "white", color: reason === r ? C.orange : C.textPrimary, transition: "all 0.15s" }}
              >{r}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 8px" }}>Custom note (optional)</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`e.g. "Ran out of oat milk — will restock tomorrow."`}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.textPrimary, resize: "none", height: 80, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1.5px solid ${C.border}`, backgroundColor: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", color: C.textPrimary }}>Cancel</button>
          <button onClick={() => onConfirm(orderId, reason, note)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", backgroundColor: C.red, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Confirm Decline</button>
        </div>
      </div>
    </div>
  );
}

// ── Discount Toggle ───────────────────────────────────────────────────────────
function DiscountToggle({ value, onChange }: { value: DiscountType | null; onChange: (v: DiscountType | null) => void }) {
  const types: DiscountType[] = ["PWD", "Senior Citizen", "Student"];
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>Discount</span>
        {value && (
          <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>−20% applied</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {types.map((t) => {
          const active = value === t;
          return (
            <button
              key={t}
              className="btn-press"
              onClick={() => onChange(active ? null : t)}
              style={{
                flex: 1, padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: `1.5px solid ${active ? C.green : C.border}`,
                backgroundColor: active ? C.greenLight : "white",
                color: active ? C.green : C.textSecondary, transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── E-Receipt Modal ───────────────────────────────────────────────────────────
interface EReceiptProps {
  order: Order;
  discountType?: DiscountType | null;
  discountAmount?: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  cashTendered?: number;
  cashChange?: number;
  gcashReference?: string;
  onClose: () => void;
}
function EReceiptModal({ order, discountType, discountAmount, finalTotal, paymentMethod, cashTendered, cashChange, gcashReference, onClose }: EReceiptProps) {
  const now = new Date();
  const refNo = `RC-${order.id}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return (
    <div
      className="modal-overlay"
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel" style={{ backgroundColor: "white", borderRadius: 18, width: 400, maxWidth: "92vw", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.sidebar} 0%, #4A2818 100%)`, padding: "24px 28px 20px", textAlign: "center", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <IconX />
          </button>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.orange, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <IconCoffee />
          </div>
          <p style={{ color: "white", fontWeight: 800, fontSize: 16, margin: "0 0 2px", letterSpacing: "0.05em" }}>QR CAFÉ</p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: 0, letterSpacing: "0.08em" }}>OFFICIAL E-RECEIPT</p>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Meta row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[
              ["Receipt No.", refNo],
              ["Order ID", `#${order.id}`],
              ["Date", now.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })],
              ["Time", fmtTime(now)],
              ["Customer", order.customer],
              ["Type", order.type],
            ].map(([label, val]) => (
              <div key={label}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{label}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1.5px dashed ${C.border}`, margin: "0 0 14px" }} />

          {/* Items */}
          <p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Items</p>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ flex: 1, paddingRight: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 2px" }}>{item.name}</p>
                {item.variant && <p style={{ fontSize: 11, color: C.textSecondary, margin: 0 }}>{item.variant}</p>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>{item.qty} × {fmt(item.unitPrice)}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, margin: "2px 0 0" }}>{fmt(item.unitPrice * item.qty)}</p>
              </div>
            </div>
          ))}

          <div style={{ borderTop: `1.5px dashed ${C.border}`, margin: "12px 0" }} />

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: C.textSecondary }}>Subtotal</span>
            <span style={{ fontSize: 13, color: C.textPrimary }}>{fmt(order.subtotal)}</span>
          </div>
          {discountType && discountAmount != null && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: C.green }}>{discountType} Discount (20%)</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>−{fmt(discountAmount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: C.textPrimary }}>TOTAL</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.orange }}>{fmt(finalTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.textSecondary }}>Payment Method</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{paymentMethod === "cash" ? "Cash" : "GCash / QR"}</span>
          </div>
          {paymentMethod === "gcash" && gcashReference && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, paddingBottom: 10, borderBottom: `1px dashed ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.textSecondary }}>GCash Ref. No.</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, fontFamily: "monospace", letterSpacing: "0.05em" }}>{gcashReference}</span>
            </div>
          )}
          {paymentMethod === "cash" && cashTendered != null && cashTendered > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.textSecondary }}>Cash Tendered</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{fmt(cashTendered)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, paddingBottom: 10, borderBottom: `1px dashed ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.textSecondary }}>Change</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{fmt(Math.max(0, cashChange ?? 0))}</span>
              </div>
            </>
          )}

          {/* Barcode strip */}
          <div style={{ backgroundColor: "#F5F0EA", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 1.5, marginBottom: 6 }}>
              {Array.from({ length: 38 }, (_, i) => (
                <div key={i} style={{ width: (i % 5 === 0 || i % 7 === 0) ? 3 : 1.5, height: (i % 3 === 0) ? 32 : 24, backgroundColor: C.textPrimary, borderRadius: 1 }} />
              ))}
            </div>
            <p style={{ fontSize: 10, fontFamily: "monospace", color: C.textSecondary, margin: 0, letterSpacing: "0.15em" }}>{refNo}</p>
          </div>
          <p style={{ fontSize: 11, color: C.textMuted, textAlign: "center", margin: "14px 0 0", lineHeight: 1.6 }}>
            Thank you for visiting QR Café!<br />Please keep this receipt for your records.
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <button className="btn-press" onClick={() => window.print()} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${C.border}`, backgroundColor: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.textSecondary }}>Print</button>
          <button className="btn-press" onClick={onClose} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", backgroundColor: C.orange, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/cafe/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Sign in failed");
      onLogin(data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Can't reach the server.");
      setLoading(false);
    }
  };
  return (
    <div className="login-screen" style={{ minHeight: "100vh", backgroundColor: C.pageBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="login-card" style={{ display: "flex", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.15)", width: 860, maxWidth: "95vw" }}>
        <div className="login-visual" style={{ width: 380, position: "relative", overflow: "hidden" }}>
          <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=760&h=640&fit=crop&auto=format" alt="Café interior" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(30,10,5,0.5) 0%, rgba(30,10,5,0.75) 100%)" }} />
          <div style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: C.orange, display: "flex", alignItems: "center", justifyContent: "center" }}><IconCoffee /></div>
            <span style={{ color: "white", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em" }}>ORDERING SYSTEM</span>
          </div>
          <div style={{ position: "absolute", bottom: 32, left: 28, right: 28 }}>
            <h2 style={{ color: "white", fontSize: 26, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.2 }}>Cozy brews &amp; fresh pastries.</h2>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>Providing the best service to our beloved guests, one cup at a time.</p>
          </div>
        </div>
        <div className="login-form-panel" style={{ flex: 1, backgroundColor: "white", padding: "48px 44px" }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: C.textPrimary, margin: "0 0 6px" }}>Cashier Sign In</h2>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: "0 0 36px" }}>Enter your system credentials to access Station 1</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Username / ID</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C.orange)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
            </div>
            <div style={{ marginBottom: 36 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C.orange)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
            </div>
            {error && (
              <p style={{ color: "#B00020", fontSize: 13, fontWeight: 600, margin: "-18px 0 18px" }}>{error}</p>
            )}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", backgroundColor: C.orange, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing in…" : "Sign In to POS"}
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: 12, color: C.textMuted, marginTop: 20 }}>Trouble logging in? Contact System Administrator.</p>
        </div>
      </div>
    </div>
  );
}

// ── Order Queue Screen ────────────────────────────────────────────────────────
interface OrderQueueProps {
  orders: Order[];
  onAccept: (id: number) => void;
  onMarkReady: (id: number) => void;
  onCompleteReady: (id: number) => void;
  onDecline: (id: number) => void;
  onViewReceipt: (id: number) => void;
}
function OrderQueue({ orders, onAccept, onMarkReady, onCompleteReady, onDecline, onViewReceipt }: OrderQueueProps) {
  const [receiptOrderId, setReceiptOrderId] = useState<number | null>(null);
  const receiptOrder = receiptOrderId != null ? orders.find((o) => o.id === receiptOrderId) : null;
  const cols: { status: OrderStatus; label: string; dot: string; badgeBg: string; badgeColor: string }[] = [
    { status: "new", label: "New", dot: "#EF4444", badgeBg: "#FFF3ED", badgeColor: C.orange },
    { status: "preparing", label: "Preparing", dot: C.blue, badgeBg: C.blueLight, badgeColor: C.blue },
    { status: "ready", label: "Ready", dot: C.green, badgeBg: C.greenLight, badgeColor: C.green },
    { status: "completed", label: "Completed", dot: "#555", badgeBg: "#F0F0F0", badgeColor: "#555" },
    { status: "declined", label: "Declined", dot: "#888", badgeBg: "#F0F0F0", badgeColor: "#888" },
  ];
  const countLabel = (status: OrderStatus) => {
    const n = orders.filter((o) => o.status === status).length;
    if (status === "completed") return `${n} Today`;
    if (status === "declined") return `${n} Today`;
    return n === 1 ? "1 Order" : `${n} Orders`;
  };
  return (
    <>
      <TopBar title="Live Orders Queue" subtitle="Real-time order tracker and status actions" />
      <div className="queue-scroll" style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
        <div className="queue-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, alignItems: "start" }}>
          {cols.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: col.dot }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{col.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, backgroundColor: col.badgeBg, color: col.badgeColor }}>
                    {countLabel(col.status)}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {colOrders.map((order) => (
                    <QueueCard
                      key={order.id}
                      order={order}
                      onAccept={onAccept}
                      onMarkReady={onMarkReady}
                      onCompleteReady={onCompleteReady}
                      onDecline={onDecline}
                      onViewReceipt={(id) => setReceiptOrderId(id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {receiptOrder && (
        <OrderDetailModal order={receiptOrder} onClose={() => setReceiptOrderId(null)} />
      )}
    </>
  );
}

interface QueueCardProps {
  order: Order;
  onAccept: (id: number) => void;
  onMarkReady: (id: number) => void;
  onCompleteReady: (id: number) => void;
  onDecline: (id: number) => void;
  onViewReceipt: (id: number) => void;
}
function QueueCard({ order, onAccept, onMarkReady, onCompleteReady, onDecline, onViewReceipt }: QueueCardProps) {
  const isReady = order.status === "ready";
  return (
    // No onClick on the card — cards are not clickable
    <div className="queue-card" style={{ backgroundColor: C.card, borderRadius: 12, padding: "14px", border: isReady ? `2px solid ${C.green}` : `1px solid ${C.border}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>#{order.id}</span>
        <TypeBadge type={order.type} />
        {order.status === "declined" && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, backgroundColor: "#FFE8E8", color: "#B00020" }}>Declined</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 500, color: C.textSecondary }}>{order.customer}</span>
      </div>
      {/* Items */}
      <div style={{ marginBottom: 10 }}>
        {order.items.slice(0, 3).map((item, i) => (
          <p key={i} style={{ fontSize: 12, color: C.textSecondary, margin: "2px 0", lineHeight: 1.4 }}>
            {item.qty}x {item.name}{item.variant ? ` (${item.variant})` : ""}
          </p>
        ))}
        {order.items.length > 3 && <p style={{ fontSize: 12, color: C.textMuted, margin: "2px 0" }}>+{order.items.length - 3} more</p>}
      </div>
      {/* Decline reason */}
      {order.status === "declined" && order.declineReason && (
        <div style={{ marginBottom: 8, padding: "4px 8px", borderRadius: 6, backgroundColor: "#FFF0F0", border: "1px solid #FFD5D5" }}>
          <span style={{ fontSize: 11, color: "#B00020" }}>Reason: {order.declineReason}</span>
        </div>
      )}
      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (order.status !== "completed" && order.status !== "declined") ? 10 : 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{fmt(order.subtotal)}</span>
        <span style={{ fontSize: 11, color: C.textMuted }}>{timeAgo(order.createdAt)}</span>
      </div>
      {/* Actions */}
      {order.status === "new" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-press" onClick={() => onAccept(order.id)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: "none", backgroundColor: C.orange, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Accept</button>
          <button className="btn-press" onClick={() => onDecline(order.id)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1.5px solid ${C.border}`, backgroundColor: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.textPrimary }}>Decline</button>
        </div>
      )}
      {order.status === "preparing" && (
        <button className="btn-press" onClick={() => onMarkReady(order.id)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", backgroundColor: C.blue, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Mark Ready</button>
      )}
      {order.status === "ready" && (
        // Payment already settled at Accept — directly complete
        <button className="btn-press" onClick={() => onCompleteReady(order.id)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", backgroundColor: C.green, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Complete Order</button>
      )}
      {order.status === "completed" && (
        <button className="btn-press" onClick={() => onViewReceipt(order.id)} style={{ width: "100%", padding: "7px", borderRadius: 8, border: `1.5px solid ${C.border}`, backgroundColor: "white", fontSize: 12, color: C.textSecondary, cursor: "pointer" }}>View Receipt</button>
      )}
    </div>
  );
}

// ── Order Workspace Screen ────────────────────────────────────────────────────
interface WorkspaceProps {
  orders: Order[];
  selectedId: number | null;
  onSelectOrder: (id: number) => void;
  onCompletePayment: (id: number, method: PaymentMethod) => void;
}
function OrderWorkspace({ orders, selectedId, onSelectOrder, onCompletePayment }: WorkspaceProps) {
  // Workspace only handles new (QR) orders pending acceptance + payment
  const activeOrders = orders.filter((o) => o.status === "new");
  const order = orders.find((o) => o.id === selectedId) ?? activeOrders[0] ?? null;
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [cashInput, setCashInput] = useState("");
  const [gcashRef, setGcashRef] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType | null>(null);
  const [receipt, setReceipt] = useState<{ discountType: DiscountType | null; discountAmt: number; finalTotal: number; method: PaymentMethod; cashTendered: number; cashChange: number; gcashRef: string } | null>(null);

  const baseTotal = order?.total ?? 0;
  const discountAmt = discountType ? Math.round(baseTotal * DISCOUNT_RATE * 100) / 100 : 0;
  const finalTotal = baseTotal - discountAmt;
  const cashAmount = parseFloat(cashInput.replace(/[^\d.]/g, "")) || 0;
  const change = cashAmount - finalTotal;

  return (
    <>
      <TopBar title="Order Workspace" subtitle="Accept and settle payment for incoming QR/website orders" />
      <div className="workspace-layout" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: Active Orders List */}
        <div className="workspace-list" style={{ width: 280, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: "16px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Incoming Orders</p>
          {activeOrders.length === 0 && <p style={{ fontSize: 13, color: C.textMuted, textAlign: "center", marginTop: 40 }}>No pending orders</p>}
          {activeOrders.map((o) => (
            <div
              key={o.id}
              className="workspace-order-item"
              onClick={() => onSelectOrder(o.id)}
              style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 8, cursor: "pointer", border: o.id === (order?.id ?? -1) ? `2px solid ${C.orange}` : `1px solid ${C.border}`, backgroundColor: o.id === (order?.id ?? -1) ? "#FFF8F5" : C.card }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.textPrimary }}>Order #{o.id}</span>
                <TypeBadge type={o.type} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, margin: "0 0 2px" }}>{o.customer}</p>
              <p style={{ fontSize: 11, color: C.textSecondary, margin: 0 }}>
                {o.items.map((i) => i.name).join(", ").slice(0, 36)}{o.items.map((i) => i.name).join(", ").length > 36 ? "…" : ""}
              </p>
            </div>
          ))}
        </div>

        {/* Right: Order Detail */}
        {!order ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: C.textMuted, fontSize: 15 }}>Select an order to view details</p>
          </div>
        ) : (
          <div className="workspace-detail" style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Order #{order.id}</h2>
                <TypeBadge type={order.type} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 8, backgroundColor: C.greenLight, color: C.green }}>
                Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: "0 0 24px" }}>
              {order.customer} · Received {fmtTime(order.createdAt)} · {timeAgo(order.createdAt)}
            </p>
            <div style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 20 }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, margin: "0 0 16px" }}>Order Items Breakdown</h3>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: "0 0 2px" }}>{item.qty}x {item.name}</p>
                  {item.variant && <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>{item.variant}</p>}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{fmt(item.unitPrice * item.qty)}</span>
              </div>
            ))}
            {order.note && (
              <div style={{ backgroundColor: "#F8F6F2", borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, margin: "0 0 6px" }}>Customer Note</p>
                <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>&ldquo;{order.note}&rdquo;</p>
              </div>
            )}
            {/* Discount */}
            <DiscountToggle value={discountType} onChange={setDiscountType} />
            {/* Payment toggle */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              {(["cash", "gcash"] as PaymentMethod[]).map((m) => (
                <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left", border: `1.5px solid ${payMethod === m ? C.orange : C.border}`, backgroundColor: payMethod === m ? C.orangeLight : "white", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: payMethod === m ? C.orange : C.textPrimary }}>{m === "cash" ? "Cash" : "GCash / QR Payment"}</div>
                  <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>{m === "cash" ? "Tender and compute change" : "Customer scans to pay"}</div>
                </button>
              ))}
            </div>
            {payMethod === "cash" && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {[1000, 500].map((n) => (
                    <button key={n} onClick={() => setCashInput(n.toFixed(2))} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: cashAmount === n ? C.orangeLight : "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>₱{n.toLocaleString()}</button>
                  ))}
                  <button onClick={() => setCashInput(finalTotal.toFixed(2))} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Exact Change</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>₱</span>
                  <input type="number" value={cashInput} onChange={(e) => setCashInput(e.target.value)} placeholder="0.00" style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontWeight: 600, color: C.textPrimary, fontFamily: "inherit" }} />
                  {cashInput && <span style={{ color: C.green, fontWeight: 600, fontSize: 14 }}>Change: {fmt(Math.max(0, change))}</span>}
                </div>
              </div>
            )}
            {payMethod === "gcash" && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.textSecondary, textTransform: "uppercase", margin: "0 0 8px" }}>Amount Due</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: C.textPrimary, margin: "0 0 16px" }}>{fmt(finalTotal)}</p>
                  <div style={{ display: "inline-block", padding: 16, backgroundColor: "white", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                    <QrCodeSvg size={140} />
                  </div>
                  <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>Ask the customer to scan to pay via GCash.</p>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>GCash Reference Number</label>
                  <input
                    type="text"
                    value={gcashRef}
                    onChange={(e) => setGcashRef(e.target.value)}
                    placeholder="e.g. 1234567890"
                    maxLength={13}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box", letterSpacing: "0.05em", fontFamily: "inherit" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = C.blue)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>
              </div>
            )}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginBottom: 20 }}>
              {discountAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: C.textSecondary }}>Subtotal</span>
                  <span style={{ fontSize: 13, color: C.textSecondary }}>{fmt(baseTotal)}</span>
                </div>
              )}
              {discountAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: C.green }}>{discountType} Discount (−20%)</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>−{fmt(discountAmt)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: C.orange }}>{fmt(finalTotal)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button
                className="btn-press"
                onClick={() => setReceipt({ discountType, discountAmt, finalTotal, method: payMethod, cashTendered: cashAmount, cashChange: change, gcashRef })}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1.5px solid ${C.border}`, backgroundColor: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.textSecondary }}
              >
                E-Receipt
              </button>
              <button
                className="btn-press"
                onClick={() => onCompletePayment(order.id, payMethod)}
                style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", backgroundColor: C.green, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                {payMethod === "cash" ? "Mark as Paid & Preparing" : "Confirm Payment Received & Preparing"}
              </button>
            </div>
          </div>
        )}
      </div>
      {receipt && order && (
        <EReceiptModal
          order={order}
          discountType={receipt.discountType}
          discountAmount={receipt.discountAmt}
          finalTotal={receipt.finalTotal}
          paymentMethod={receipt.method}
          cashTendered={receipt.cashTendered}
          cashChange={receipt.cashChange}
          gcashReference={receipt.gcashRef}
          onClose={() => setReceipt(null)}
        />
      )}
    </>
  );
}

// ── Manual Entry Screen ───────────────────────────────────────────────────────
interface ManualEntryProps {
  cart: CartEntry[];
  customerName: string;
  fulfillment: FulfillmentType;
  onAddItem: (entry: CartEntry) => void;
  onUpdateQty: (cartKey: string, delta: number) => void;
  onSetCustomerName: (n: string) => void;
  onSetFulfillment: (f: FulfillmentType) => void;
  onPayNow: (discountType?: DiscountType) => void;
}
function ManualEntry({ cart, customerName, fulfillment, onAddItem, onUpdateQty, onSetCustomerName, onSetFulfillment, onPayNow }: ManualEntryProps) {
  const [category, setCategory] = useState<MenuCategory>("Coffee");
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [discountType, setDiscountType] = useState<DiscountType | null>(null);
  const cats: MenuCategory[] = ["Coffee", "Non-Coffee", "Pastries"];
  const filtered = MENU_ITEMS.filter((m) => m.category === category);

  const cartTotalQty = (itemId: number) => cart.filter((e) => e.item.id === itemId).reduce((s, e) => s + e.qty, 0);
  const subtotal = cart.reduce((s, e) => s + e.effectivePrice * e.qty, 0);
  const discountAmt = discountType ? Math.round(subtotal * DISCOUNT_RATE * 100) / 100 : 0;
  const total = subtotal - discountAmt;

  return (
    <>
      <TopBar title="Walk-In & Manual Ordering" subtitle="Add items directly to construct table/dine-in orders" />
      <div className="manual-layout" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: Menu catalog */}
        <div className="menu-catalog" style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {/* Category tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{ padding: "8px 18px", borderRadius: 20, border: `1.5px solid ${c === category ? C.orange : C.border}`, backgroundColor: c === category ? C.orange : "white", color: c === category ? "white" : C.textPrimary, fontSize: 13, fontWeight: c === category ? 600 : 400, cursor: "pointer" }}
              >{c}</button>
            ))}
          </div>
          {/* Item grid */}
          <div className="menu-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {filtered.map((item) => {
              const inCart = cartTotalQty(item.id);
              return (
                <div
                  key={item.id}
                  className="menu-card"
                  onClick={() => setModalItem(item)}
                  style={{ backgroundColor: C.card, borderRadius: 12, overflow: "hidden", border: `1.5px solid ${inCart > 0 ? C.orange : C.border}`, cursor: "pointer" }}
                >
                  <div style={{ height: 140, backgroundColor: "#E8E0D5", overflow: "hidden", position: "relative" }}>
                    <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} />
                    {inCart > 0 && (
                      <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", backgroundColor: C.orange, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                        {inCart}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 2px", lineHeight: 1.3 }}>{item.name}</p>
                    <p style={{ fontSize: 11, color: C.textSecondary, margin: "0 0 6px", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                      {item.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.orange }}>{fmt(item.price)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.orange, border: `1px solid ${C.orangeLight}`, backgroundColor: C.orangeLight, borderRadius: 6, padding: "3px 10px" }}>
                        + Add
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="cart-panel" style={{ width: 320, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>Current Cart Order</span>
            <TypeBadge type={fulfillment} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {/* Customer name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, display: "block", marginBottom: 6 }}>Customer Name</label>
              <input value={customerName} onChange={(e) => onSetCustomerName(e.target.value)} placeholder="e.g. Alex C." style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }} onFocus={(e) => (e.currentTarget.style.borderColor = C.orange)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
            </div>
            {/* Fulfillment */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, display: "block", marginBottom: 6 }}>Fulfillment</label>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1.5px solid ${C.border}` }}>
                {(["Dine In", "Take Out"] as FulfillmentType[]).map((f) => (
                  <button key={f} onClick={() => onSetFulfillment(f)} style={{ flex: 1, padding: "9px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", backgroundColor: fulfillment === f ? C.orange : "white", color: fulfillment === f ? "white" : C.textPrimary, transition: "all 0.15s" }}>{f}</button>
                ))}
              </div>
            </div>
            {/* Cart items */}
            {cart.length === 0 && <p style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: "20px 0" }}>No items added yet.</p>}
            {cart.map((entry) => {
              const variantStr = entry.item.isDrink
                ? buildVariantString(entry.size, entry.sugarLevel, entry.temp)
                : "";
              return (
                <div key={entry.cartKey} className="cart-row-enter" style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, flex: 1, paddingRight: 8 }}>{entry.item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.orange, whiteSpace: "nowrap" }}>{fmt(entry.effectivePrice * entry.qty)}</span>
                  </div>
                  {variantStr && <p style={{ fontSize: 11, color: C.textSecondary, margin: "0 0 6px" }}>{variantStr}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => onUpdateQty(entry.cartKey, -1)} style={qtyBtnStyle}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{entry.qty}</span>
                    <button onClick={() => onUpdateQty(entry.cartKey, 1)} style={{ ...qtyBtnStyle, backgroundColor: C.orange, color: "white", border: "none" }}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Totals + action */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}` }}>
            <DiscountToggle value={discountType} onChange={setDiscountType} />
            {discountAmt > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.textSecondary }}>Subtotal</span>
                <span style={{ fontSize: 12, color: C.textSecondary }}>{fmt(subtotal)}</span>
              </div>
            )}
            {discountAmt > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.green }}>{discountType} (−20%)</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.green }}>−{fmt(discountAmt)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>Order Total</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.orange }}>{fmt(total)}</span>
            </div>
            <button
              onClick={() => onPayNow(discountType ?? undefined)}
              disabled={cart.length === 0}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", backgroundColor: cart.length === 0 ? "#CCC" : C.orange, color: "white", fontSize: 14, fontWeight: 700, cursor: cart.length === 0 ? "not-allowed" : "pointer" }}
            >
              Pay &amp; Send to Kitchen
            </button>
          </div>
        </div>
      </div>

      {/* Item Customization Modal */}
      {modalItem && (
        <ItemCustomizationModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onAddToCart={(entry) => {
            onAddItem(entry);
            setModalItem(null);
          }}
        />
      )}
    </>
  );
}
const qtyBtnStyle: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

// ── Payment Checkout Screen ───────────────────────────────────────────────────
interface CheckoutProps { order: Order; onConfirm: (method: PaymentMethod) => void; onBack: () => void; }
function PaymentCheckout({ order, onConfirm, onBack }: CheckoutProps) {
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [cashInput, setCashInput] = useState("");
  const [gcashRef, setGcashRef] = useState("");
  const [receipt, setReceipt] = useState<{ method: PaymentMethod; cashTendered: number; cashChange: number; gcashRef: string } | null>(null);
  const cashAmount = parseFloat(cashInput.replace(/[^\d.]/g, "")) || 0;
  const change = cashAmount - order.total;
  return (
    <>
      <TopBar title="Payment Checkout" subtitle="Review cart and settle transaction" />
      <div className="checkout-layout" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div className="checkout-summary" style={{ width: 340, borderRight: `1px solid ${C.border}`, padding: "24px", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Order #{order.id} Settle</h3>
            <TypeBadge type={order.type} />
          </div>
          <div style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 16 }} />
          {order.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 2px" }}>{item.qty}x {item.name}</p>
                {item.variant && <p style={{ fontSize: 11, color: C.textSecondary, margin: 0 }}>{item.variant}</p>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(item.unitPrice * item.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 8 }}>
            {order.discount != null && order.discount > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: C.textSecondary }}>Subtotal</span>
                  <span style={{ fontSize: 13 }}>{fmt(order.subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: C.green }}>{order.discountType} Discount (−20%)</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>−{fmt(order.discount)}</span>
                </div>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.orange }}>{fmt(order.total)}</span>
            </div>
          </div>
        </div>
        <div className="checkout-payment" style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: "0 0 24px" }}>Settle Payment</h3>
          <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
            {(["cash", "gcash"] as PaymentMethod[]).map((m) => (
              <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: "14px 18px", borderRadius: 12, cursor: "pointer", textAlign: "left", border: `1.5px solid ${payMethod === m ? C.orange : C.border}`, backgroundColor: payMethod === m ? C.orangeLight : "white", transition: "all 0.15s" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: payMethod === m ? C.orange : C.textPrimary }}>{m === "cash" ? "Cash" : "GCash / QR Payment"}</div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{m === "cash" ? "Tender and compute change" : "Customer scans to pay"}</div>
              </button>
            ))}
          </div>
          {payMethod === "cash" && (
            <>
              <div style={{ border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.textSecondary, margin: "0 0 6px", textTransform: "uppercase" }}>Cash Tendered</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: C.textPrimary }}>₱</span>
                    <input type="number" value={cashInput} onChange={(e) => setCashInput(e.target.value)} placeholder="0" style={{ fontSize: 28, fontWeight: 800, color: C.textPrimary, border: "none", outline: "none", width: 200, fontFamily: "inherit" }} />
                  </div>
                  {cashInput && <button onClick={() => setCashInput("")} style={{ fontSize: 18, color: C.textMuted, background: "none", border: "none", cursor: "pointer" }}>×</button>}
                </div>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 10px" }}>Quick Denominations</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {[["Exact Change", order.total], [500, 500], [1000, 1000], [2000, 2000]].map(([label, val]) => (
                  <button key={String(label)} onClick={() => setCashInput(Number(val).toFixed(2))} style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${cashAmount === Number(val) ? C.orange : C.border}`, backgroundColor: cashAmount === Number(val) ? C.orange : "white", color: cashAmount === Number(val) ? "white" : C.textPrimary }}>
                    {label === "Exact Change" ? "Exact Change" : `₱${Number(val).toLocaleString()}`}
                  </button>
                ))}
              </div>
              <div style={{ borderRadius: 12, padding: "16px 20px", backgroundColor: change >= 0 ? C.greenLight : "#FFF0F0", marginBottom: 28 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.green, margin: "0 0 6px", textTransform: "uppercase" }}>Change Due</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: C.green, margin: 0 }}>{change >= 0 ? fmt(change) : "—"}</p>
              </div>
            </>
          )}
          {payMethod === "gcash" && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.textSecondary, textTransform: "uppercase", margin: "0 0 8px" }}>Amount Due</p>
                <p style={{ fontSize: 36, fontWeight: 800, color: C.textPrimary, margin: "0 0 20px" }}>{fmt(order.total)}</p>
                <div style={{ display: "inline-block", padding: 16, backgroundColor: "white", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                  <QrCodeSvg size={160} />
                </div>
                <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 8 }}>Ask the customer to scan to pay via GCash.</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>GCash Reference Number</label>
                <input
                  type="text"
                  value={gcashRef}
                  onChange={(e) => setGcashRef(e.target.value)}
                  placeholder="e.g. 1234567890"
                  maxLength={13}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontWeight: 600, outline: "none", boxSizing: "border-box", letterSpacing: "0.05em", fontFamily: "inherit" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.blue)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn-press"
              onClick={() => setReceipt({ method: payMethod, cashTendered: cashAmount, cashChange: change, gcashRef })}
              style={{ flex: 1, padding: "14px", borderRadius: 12, border: `1.5px solid ${C.border}`, backgroundColor: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: C.textSecondary }}
            >
              E-Receipt
            </button>
            <button className="btn-press" onClick={() => onConfirm(payMethod)} style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", backgroundColor: C.green, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Confirm Payment &amp; Complete
            </button>
          </div>
        </div>
      </div>
      {receipt && (
        <EReceiptModal
          order={order}
          discountType={order.discountType}
          discountAmount={order.discount}
          finalTotal={order.total}
          paymentMethod={receipt.method}
          cashTendered={receipt.cashTendered}
          cashChange={receipt.cashChange}
          gcashReference={receipt.gcashRef}
          onClose={() => setReceipt(null)}
        />
      )}
    </>
  );
}

// ── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const payLabel: Record<string, string> = { cash: "Cash", gcash: "GCash / QR" };
  return (
    <div
      className="modal-overlay"
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel" style={{ backgroundColor: "white", borderRadius: 18, width: 540, maxWidth: "92vw", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ padding: "22px 28px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary, margin: 0 }}>Order #{order.id}</h2>
              <TypeBadge type={order.type} />
              <StatusPill status={order.status} />
            </div>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
              {order.customer} · {order.createdAt.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })} · {fmtTime(order.createdAt)}
            </p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textSecondary, flexShrink: 0 }}>
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px" }}>
          {/* Items */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.textSecondary, textTransform: "uppercase", margin: "0 0 14px" }}>Items Ordered</p>
          <div style={{ marginBottom: 22 }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "11px 0", borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: "0 0 3px" }}>
                    <span style={{ display: "inline-block", width: 22, height: 22, borderRadius: 6, backgroundColor: C.orangeLight, color: C.orange, fontSize: 11, fontWeight: 700, textAlign: "center", lineHeight: "22px", marginRight: 8 }}>{item.qty}</span>
                    {item.name}
                  </p>
                  {item.variant && <p style={{ fontSize: 12, color: C.textSecondary, margin: "0 0 0 30px" }}>{item.variant}</p>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, margin: 0 }}>{fmt(item.unitPrice * item.qty)}</p>
                  {item.qty > 1 && <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>{fmt(item.unitPrice)} each</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Customer note */}
          {order.note && (
            <div style={{ backgroundColor: "#F8F6F2", borderRadius: 10, padding: "12px 16px", marginBottom: 22, border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.textSecondary, textTransform: "uppercase", margin: "0 0 6px" }}>Customer Note</p>
              <p style={{ fontSize: 13, color: C.textPrimary, margin: 0, lineHeight: 1.6 }}>&ldquo;{order.note}&rdquo;</p>
            </div>
          )}

          {/* Totals */}
          <div style={{ backgroundColor: "#F9F6F2", borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.orange }}>{fmt(order.total)}</span>
            </div>
          </div>

          {/* Payment + completion row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, padding: "12px 16px", backgroundColor: "white" }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.textSecondary, textTransform: "uppercase", margin: "0 0 6px" }}>Payment Method</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
                {order.paymentMethod ? payLabel[order.paymentMethod] ?? order.paymentMethod : "—"}
              </p>
            </div>
            <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, padding: "12px 16px", backgroundColor: "white" }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.textSecondary, textTransform: "uppercase", margin: "0 0 6px" }}>Completed At</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
                {order.completedAt ? fmtTime(order.completedAt) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <button style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${C.border}`, backgroundColor: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.textSecondary }}>Print Receipt</button>
          <button className="btn-press" onClick={onClose} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", backgroundColor: C.textPrimary, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Decline Reason Modal ──────────────────────────────────────────────────────
function DeclineReasonModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const reasonColors: Record<string, { bg: string; color: string }> = {
    "Out of Stock": { bg: "#FFF3ED", color: C.orange },
    "Kitchen Closing": { bg: C.blueLight, color: C.blue },
    "Other": { bg: "#F5F5F5", color: "#555" },
  };
  const rc = reasonColors[order.declineReason ?? "Other"] ?? reasonColors["Other"];
  return (
    <div
      className="modal-overlay"
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel" style={{ backgroundColor: "white", borderRadius: 18, width: 480, maxWidth: "92vw", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        {/* Red accent top bar */}
        <div style={{ height: 4, backgroundColor: "#B00020" }} />

        <div style={{ padding: "26px 28px 24px" }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary }}>Order #{order.id} — Declined</span>
              </div>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
                {order.customer} · {order.type} · {fmtTime(order.createdAt)}
              </p>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textSecondary, flexShrink: 0, marginTop: 2 }}>
              <IconX />
            </button>
          </div>

          {/* Items quick summary */}
          <div style={{ borderRadius: 10, backgroundColor: "#FAFAFA", border: `1px solid ${C.border}`, padding: "12px 16px", marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.textSecondary, textTransform: "uppercase", margin: "0 0 8px" }}>Items in Order</p>
            {order.items.map((item, i) => (
              <p key={i} style={{ fontSize: 13, color: C.textPrimary, margin: "0 0 4px", lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600 }}>{item.qty}×</span> {item.name}
                {item.variant && <span style={{ color: C.textSecondary }}> · {item.variant}</span>}
              </p>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: C.textSecondary }}>Order total</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{fmt(order.total)}</span>
            </div>
          </div>

          {/* Decline reason */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.textSecondary, textTransform: "uppercase", margin: "0 0 10px" }}>Decline Reason</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 12, backgroundColor: rc.bg, border: `1.5px solid ${rc.color}20`, marginBottom: order.declineNote ? 16 : 24 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: rc.color, flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: rc.color }}>{order.declineReason ?? "—"}</span>
          </div>

          {/* Custom note if present */}
          {order.declineNote && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.textSecondary, textTransform: "uppercase", margin: "0 0 8px" }}>Staff Note</p>
              <div style={{ padding: "12px 16px", borderRadius: 10, backgroundColor: "#F8F6F2", border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 13, color: C.textPrimary, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>&ldquo;{order.declineNote}&rdquo;</p>
              </div>
            </div>
          )}

          <button className="btn-press" onClick={onClose} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", backgroundColor: C.textPrimary, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Order History Screen ──────────────────────────────────────────────────────
function OrderHistory({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "declined">("all");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [reasonOrder, setReasonOrder] = useState<Order | null>(null);

  const historical = orders.filter((o) => o.status === "completed" || o.status === "declined").sort((a, b) => b.id - a.id);
  const filtered = historical.filter((o) => {
    const matchSearch = !search || `#${o.id}`.includes(search) || o.customer.toLowerCase().includes(search.toLowerCase()) || o.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });
  return (
    <>
      <TopBar title="Order History" subtitle="Lookup and review completed orders" />
      <div className="history-content" style={{ padding: "20px 32px", flex: 1, overflowY: "auto" }}>
        <div className="history-filters" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Order ID, table..." style={{ flex: 1, maxWidth: 320, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: "none" }} onFocus={(e) => (e.currentTarget.style.borderColor = C.orange)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
          <div style={{ display: "flex", marginLeft: "auto" }}>
            {(["all", "completed", "declined"] as const).map((f, i) => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${C.border}`, borderRadius: i === 0 ? "8px 0 0 8px" : i === 2 ? "0 8px 8px 0" : "0", backgroundColor: statusFilter === f ? C.textPrimary : "white", color: statusFilter === f ? "white" : C.textPrimary, marginLeft: i > 0 ? -1 : 0 }}>
                {f === "all" ? "All Status" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="table-scroll" style={{ backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#F9F6F2" }}>
                {["ORDER ID", "TIME", "TYPE", "ITEMS SUMMARY", "TOTAL", "STATUS", "ACTIONS"].map((col) => (
                  <th key={col} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: "0.08em" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, idx) => (
                <tr key={order.id} style={{ borderTop: `1px solid ${C.border}`, backgroundColor: idx % 2 === 0 ? "white" : "#FAFAFA", transition: "background-color 0.12s" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#FFF8F5")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "white" : "#FAFAFA")}
                >
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>#{order.id}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: C.textSecondary }}>{fmtTime(order.createdAt)}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: C.textSecondary }}>{order.type}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: C.textSecondary, maxWidth: 240 }}>
                    {order.items.map((i) => `${i.qty > 1 ? `${i.qty}x ` : ""}${i.name}`).join(", ").slice(0, 50)}{order.items.map((i) => i.name).join(", ").length > 50 ? "…" : ""}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{fmt(order.total)}</td>
                  <td style={{ padding: "14px 16px" }}><StatusPill status={order.status} /></td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      className="btn-press"
                      onClick={() => order.status === "declined" ? setReasonOrder(order) : setDetailOrder(order)}
                      style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${order.status === "declined" ? "#FFD5D5" : C.border}`, backgroundColor: order.status === "declined" ? "#FFF0F0" : "white", fontSize: 12, cursor: "pointer", color: order.status === "declined" ? "#B00020" : C.textPrimary, fontWeight: 600, transition: "all 0.15s" }}
                    >
                      {order.status === "declined" ? "View Reason" : "Details"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: C.textMuted, fontSize: 14 }}>No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}
      {reasonOrder && <DeclineReasonModal order={reasonOrder} onClose={() => setReasonOrder(null)} />}
    </>
  );
}

// ── Sales Report Screen ───────────────────────────────────────────────────────
function SalesReport({ orders }: { orders: Order[] }) {
  const today = new Date();
  const [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const inRange = orders.filter((o) => {
    if (o.status !== "completed") return false;
    const d = o.createdAt.toISOString().split("T")[0];
    return d >= startDate && d <= endDate;
  });
  const revenue = inRange.reduce((s, o) => s + o.total, 0);
  const transactions = inRange.length;
  const avgTicket = transactions > 0 ? revenue / transactions : 0;
  const catRevenue: Record<string, number> = {};
  const itemRevenue: Record<string, { units: number; revenue: number }> = {};
  inRange.forEach((o) => {
    o.items.forEach((item) => {
      const cat = MENU_ITEMS.find((m) => m.name === item.name)?.category ?? "Other";
      catRevenue[cat] = (catRevenue[cat] ?? 0) + item.unitPrice * item.qty;
      if (!itemRevenue[item.name]) itemRevenue[item.name] = { units: 0, revenue: 0 };
      itemRevenue[item.name].units += item.qty;
      itemRevenue[item.name].revenue += item.unitPrice * item.qty;
    });
  });
  const totalCatRev = Object.values(catRevenue).reduce((s, v) => s + v, 0) || 1;
  const sortedItems = Object.entries(itemRevenue).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 6);
  const topCat = Object.entries(catRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const topCatPct = totalCatRev > 0 ? Math.round((catRevenue[topCat] ?? 0) / totalCatRev * 100) : 0;
  function exportData() {
    const headers = ["Order ID","Date","Customer","Type","Items","Total","Payment"];
    const rows = inRange.map((o) => [
      `#${o.id}`, o.createdAt.toLocaleDateString(), o.customer, o.type,
      o.items.map((i) => `${i.qty}x ${i.name}`).join("; "),
      o.total.toFixed(2), o.paymentMethod ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }
  const cats = ["Coffee", "Non-Coffee", "Pastries"];
  const catColors: Record<string, string> = { Coffee: C.orange, "Non-Coffee": C.blue, Pastries: "#E67E22" };
  return (
    <>
      <TopBar title="Sales & Performance" subtitle="Real-time analytics and report export" />
      <div className="report-content" style={{ padding: "20px 32px", flex: 1, overflowY: "auto" }}>
        <div className="report-toolbar" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div className="report-dates" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, backgroundColor: "white" }}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13, fontFamily: "inherit" }} />
            <span style={{ color: C.textMuted }}>–</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13, fontFamily: "inherit" }} />
          </div>
          <div style={{ marginLeft: "auto", position: "relative" }}>
            <button onClick={() => setShowExportMenu((v) => !v)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", backgroundColor: C.green, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Export Excel / CSV ▾</button>
            {showExportMenu && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", backgroundColor: "white", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", border: `1px solid ${C.border}`, overflow: "hidden", zIndex: 10, minWidth: 160 }}>
                <button onClick={exportData} style={{ display: "block", width: "100%", padding: "11px 18px", textAlign: "left", fontSize: 13, border: "none", backgroundColor: "white", cursor: "pointer", color: C.textPrimary }}>Export as Excel (.csv)</button>
                <button onClick={exportData} style={{ display: "block", width: "100%", padding: "11px 18px", textAlign: "left", fontSize: 13, border: "none", borderTop: `1px solid ${C.border}`, backgroundColor: "white", cursor: "pointer", color: C.textPrimary }}>Export as CSV</button>
              </div>
            )}
          </div>
        </div>
        <div className="report-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard label="TOTAL REVENUE" value={fmt(revenue)} sub={`${transactions} orders in period`} valueColor={C.orange} />
          <StatCard label="TRANSACTIONS" value={`${transactions} Orders`} sub="+8.2% vs last week" />
          <StatCard label="AVERAGE TICKET" value={fmt(avgTicket)} sub="-2.1% vs last week" />
          <StatCard label="TOP PRODUCT CATEGORY" value={topCat || "—"} sub={`${topCatPct}% of overall sales`} valueColor={C.green} large />
        </div>
        <div className="report-details" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, margin: "0 0 20px" }}>Sales Distribution by Category</h3>
            {cats.map((cat) => {
              const rev = catRevenue[cat] ?? 0;
              const pct = Math.round((rev / totalCatRev) * 100);
              return (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.textSecondary }}>{cat} ({pct}%)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{fmt(rev)}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, backgroundColor: "#EEE" }}>
                    <div style={{ height: "100%", borderRadius: 4, backgroundColor: catColors[cat] ?? C.orange, width: `${pct}%`, transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, margin: "0 0 16px" }}>Top Performing Menu Items</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0 16px", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: "0.08em" }}>ITEM NAME</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: "0.08em" }}>UNITS SOLD</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: "0.08em" }}>REVENUE</span>
            </div>
            {sortedItems.length === 0 && <p style={{ fontSize: 13, color: C.textMuted, margin: "20px 0" }}>No data in selected range.</p>}
            {sortedItems.map(([name, data]) => (
              <div key={name} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0 16px", padding: "10px 0", borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{name}</span>
                <span style={{ fontSize: 13, color: C.textSecondary }}>{data.units} units</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{fmt(data.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
function StatCard({ label, value, sub, valueColor, large }: { label: string; value: string; sub: string; valueColor?: string; large?: boolean }) {
  return (
    <div style={{ backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px 22px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: "0.08em", margin: "0 0 10px", textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: large ? 22 : 26, fontWeight: 800, color: valueColor ?? C.textPrimary, margin: "0 0 6px", lineHeight: 1.1 }}>{value}</p>
      <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{sub}</p>
    </div>
  );
}

const API = "/cafe/api";

// The API sends dates as text, but the screens expect Date objects
function parseOrder(o: any): Order {
  return {
    ...o,
    createdAt: new Date(o.createdAt),
    completedAt: o.completedAt ? new Date(o.completedAt) : undefined,
    declineReason: o.declineReason ?? undefined,
    declineNote: o.declineNote ?? undefined,
    paymentMethod: o.paymentMethod ?? undefined,
    items: o.items.map((i: any) => ({ ...i, variant: i.variant ?? undefined })),
  };
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [cashierName, setCashierName] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [offline, setOffline] = useState(false); 
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [declineTargetId, setDeclineTargetId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("Dine In");
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);

  const signOutLocally = useCallback(() => {
    setCashierName("");
    setSelectedOrderId(null);
    setScreen("login");
  }, []);

  // Restore the session after a page reload
  useEffect(() => {
    fetch(`${API}/me.php`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setCashierName(data.name);
          setScreen("queue");
        }
      })
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/queue.php`);
      if (res.status === 401) { signOutLocally(); return; }
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setOrders(data.map(parseOrder));
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [signOutLocally]);

  // Poll the server every 3 seconds once the cashier is signed in
  const loggedIn = screen !== "login";
  useEffect(() => {
    if (!loggedIn) return;
    loadOrders();
    const timer = setInterval(loadOrders, 3000);
    return () => clearInterval(timer);
  }, [loggedIn, loadOrders]);

  async function changeStatus(id: number, status: OrderStatus, extra: Record<string, unknown> = {}) {
    try {
      const res = await fetch(`${API}/status.php`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, ...extra }),
      });
      if (res.status === 401) { signOutLocally(); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Could not update the order.");
      }
    } catch {
      alert("Can't reach the server. Check that Apache and MySQL are running.");
    }
    await loadOrders();
  }

  // Accept on a QR/website order → open workspace to review and settle payment first
  const handleAccept = (id: number) => {
    setSelectedOrderId(id);
    setScreen("workspace");
  };
  const handleMarkReady = (id: number) => changeStatus(id, "ready");
  const handleDeclineClick = (id: number) => setDeclineTargetId(id);
  const handleConfirmDecline = async (id: number, reason: DeclineReason, note: string) => {
    await changeStatus(id, "declined", { reason, note });
    setDeclineTargetId(null);
  };

  // TEMPORARY: the real payment endpoint replaces this after the login step
  const handleCompletePayment = async (id: number, _method: PaymentMethod) => {
    await changeStatus(id, "preparing");
    setScreen("queue");
  };

  // "Complete Order" on Ready card → order is already paid, directly complete
  const handleCompleteReady = (id: number) => changeStatus(id, "completed");

  const handleAddItem = (entry: CartEntry) => {
    setCart((prev) => {
      const existing = prev.find((e) => e.cartKey === entry.cartKey);
      if (existing) return prev.map((e) => e.cartKey === entry.cartKey ? { ...e, qty: e.qty + entry.qty } : e);
      return [...prev, entry];
    });
  };
  const handleUpdateQty = (cartKey: string, delta: number) => {
    setCart((prev) => prev.map((e) => e.cartKey === cartKey ? { ...e, qty: e.qty + delta } : e).filter((e) => e.qty > 0));
  };

  const handlePayNow = (discountType?: DiscountType) => {
    if (cart.length === 0) return;
    const order = makeOrder(customerName || "Walk-in", fulfillment, cart, "", discountType);
    setCheckoutOrder(order);
    setScreen("checkout");
  };
  const handleCheckoutConfirm = (method: PaymentMethod) => {
    if (!checkoutOrder) return;
    // Payment done — send straight into Preparing, not Completed
    const preparing: Order = { ...checkoutOrder, status: "preparing", paymentMethod: method };
    setOrders((prev) => [preparing, ...prev]);
    setCart([]); setCustomerName(""); setCheckoutOrder(null);
    setScreen("queue");
  };
  const handleLogout = async () => {
    try { await fetch(`${API}/logout.php`, { method: "POST" }); } catch {}
    signOutLocally();
  };

  if (checkingSession) return null;
  if (screen === "login") return <LoginScreen onLogin={(name) => { setCashierName(name); setScreen("queue"); }} />;

  return (
    <div className="app-shell" style={{ display: "flex", height: "100vh", backgroundColor: C.pageBg, overflow: "hidden" }}>
      <Sidebar screen={screen} onNav={(s) => setScreen(s)} onLogout={handleLogout} name={cashierName} />
      <main key={screen} className="app-main screen-enter" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {screen === "queue" && (
          <OrderQueue
            orders={orders}
            onAccept={handleAccept}
            onMarkReady={handleMarkReady}
            onCompleteReady={handleCompleteReady}
            onDecline={handleDeclineClick}
            onViewReceipt={() => {}}
          />
        )}
        {screen === "workspace" && (
          <OrderWorkspace
            orders={orders}
            selectedId={selectedOrderId}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            onCompletePayment={handleCompletePayment}
          />
        )}
        {screen === "manual" && (
          <ManualEntry
            cart={cart}
            customerName={customerName}
            fulfillment={fulfillment}
            onAddItem={handleAddItem}
            onUpdateQty={handleUpdateQty}
            onSetCustomerName={setCustomerName}
            onSetFulfillment={setFulfillment}
            onPayNow={handlePayNow}
          />
        )}
        {screen === "checkout" && checkoutOrder && (
          <PaymentCheckout order={checkoutOrder} onConfirm={handleCheckoutConfirm} onBack={() => setScreen("manual")} />
        )}
        {screen === "history" && <OrderHistory orders={orders} />}
        {screen === "report" && <SalesReport orders={orders} />}
      </main>

      {declineTargetId !== null && (
        <DeclineDialog
          orderId={declineTargetId}
          onCancel={() => setDeclineTargetId(null)}
          onConfirm={handleConfirmDecline}
        />
      )}
      {offline && (
        <div style={{ position: "fixed", bottom: 16, right: 16, padding: "10px 16px", borderRadius: 10, backgroundColor: "#7B2D0F", color: "white", fontSize: 13, fontWeight: 600, zIndex: 2000 }}>
          Can't reach the server. Retrying...
        </div>
      )}
    </div>
  );
}
