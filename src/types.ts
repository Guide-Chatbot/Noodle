export type NoodleType = 'thin' | 'sen_mee' | 'sen_yai' | 'egg_noodle' | 'glass_noodle' | 'soup_only';
export type SoupType = 'namtok' | 'nam_sai' | 'tom_yum_namtok' | 'tom_yum_boran' | 'dry_sweet_soy';
export type MeatOption = 'pork_slice' | 'pork_braised' | 'beef_slice' | 'beef_braised' | 'pork_ball' | 'beef_ball' | 'liver';
export type SpicyLevel = 0 | 1 | 2 | 3 | 4;
export type BowlSize = 'regular' | 'special';
export type VeggieChoice = 'all' | 'morning_glory' | 'bean_sprouts' | 'none';

export interface ExtraTopping {
  id: string;
  name: string;
  price: number;
}

export type MenuCategory = 'noodles' | 'sides' | 'desserts' | 'drinks';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  specialPrice?: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  isBestSeller?: boolean;
  isCustomizable?: boolean; // For boat noodles
  prepTimeMinutes?: number;
}

export interface CustomNoodleOptions {
  bowlSize: BowlSize;
  noodleType: NoodleType;
  soupType: SoupType;
  meats: MeatOption[];
  spicyLevel: SpicyLevel;
  veggie: VeggieChoice;
  extraToppings: ExtraTopping[];
  notes?: string;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  customOptions?: CustomNoodleOptions;
}

export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'verifying' | 'paid';
export type PaymentMethod = 'promptpay' | 'cash';

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  createdAt: number;
  items: CartItem[];
  totalAmount: number;
  totalBowls: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  promptPayPayload?: string;
  slipUrl?: string;
  paidAt?: number;
  customerNote?: string;
}

export interface TableInfo {
  number: number;
  status: 'available' | 'occupied' | 'billing';
  activeOrderId?: string;
  customerCount?: number;
  totalAmount?: number;
}

export interface StoreSettings {
  storeName: string;
  branchName: string;
  promptPayNumber: string; // Phone or Tax ID
  promptPayAccountName: string;
  tableCount: number;
  regularBowlPrice: number;
  specialBowlPrice: number;
  wifiSsid: string;
  wifiPass: string;
}

export type AppViewMode = 'customer' | 'kitchen' | 'pos' | 'menu' | 'qr_tables';
