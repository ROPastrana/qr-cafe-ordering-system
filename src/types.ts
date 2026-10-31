export type Screen = "login" | "queue" | "workspace" | "manual" | "checkout" | "history" | "report";
export type OrderStatus = "new" | "preparing" | "ready" | "completed" | "declined";
export type FulfillmentType = "Dine In" | "Take Out";
export type DeclineReason = "Out of Stock" | "Kitchen Closing" | "Other";
export type PaymentMethod = "cash" | "gcash";
export type MenuCategory = "Coffee" | "Non-Coffee" | "Pastries";
export type DrinkSize = "Small" | "Medium" | "Large";
export type SugarLevel = "0%" | "25%" | "50%" | "75%" | "100%";
export type DrinkTemp = "Hot" | "Cold";

export interface OrderItem {
  name: string;
  qty: number;
  variant?: string;
  unitPrice: number;
}

export type DiscountType = "PWD" | "Senior Citizen" | "Student";

export interface Order {
  id: number;
  customer: string;
  type: FulfillmentType;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  discountType?: DiscountType;
  total: number;
  status: OrderStatus;
  note?: string;
  createdAt: Date;
  completedAt?: Date;
  declineReason?: DeclineReason;
  declineNote?: string;
  paymentMethod?: PaymentMethod;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: MenuCategory;
  price: number; // base price (Medium for drinks)
  image: string;
  isDrink: boolean;
  // "both" = hot & cold available, "hot-only" = no Cold option, "cold-only" = no Hot option
  tempOptions?: "both" | "hot-only" | "cold-only";
}

export interface CartEntry {
  item: MenuItem;
  qty: number;
  effectivePrice: number; // price after size adjustment
  cartKey: string; // unique key: itemId_size_sugar_temp
  // drink-only fields (undefined for pastries)
  size?: DrinkSize;
  sugarLevel?: SugarLevel;
  temp?: DrinkTemp;
}
