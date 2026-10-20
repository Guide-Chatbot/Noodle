import { Order, MenuItem, StoreSettings, OrderStatus, PaymentStatus } from '../types';
import { INITIAL_MENU_ITEMS, INITIAL_STORE_SETTINGS } from '../data/initialMenu';
import { sound } from '../utils/audio';

const STORAGE_KEY_MENU = 'ruea_thong_menu_items_v1';
const STORAGE_KEY_ORDERS = 'ruea_thong_orders_v1';
const STORAGE_KEY_SETTINGS = 'ruea_thong_settings_v1';
const CHANNEL_NAME = 'ruea_thong_pos_channel';

// Initial sample orders for realistic live demonstration
const SEED_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: '#TH-101',
    tableNumber: 3,
    createdAt: Date.now() - 15 * 60 * 1000,
    status: 'cooking',
    paymentStatus: 'paid',
    paymentMethod: 'promptpay',
    paidAt: Date.now() - 12 * 60 * 1000,
    totalBowls: 4,
    totalAmount: 136,
    items: [
      {
        cartItemId: 'ci-1',
        menuItemId: 'm-noodle-pork',
        name: 'ก๋วยเตี๋ยวเรือหมูอยุธยา',
        unitPrice: 25,
        quantity: 2,
        totalPrice: 50,
        customOptions: {
          bowlSize: 'regular',
          noodleType: 'thin',
          soupType: 'namtok',
          meats: ['pork_slice', 'pork_ball'],
          spicyLevel: 2,
          veggie: 'all',
          extraToppings: [],
        },
      },
      {
        cartItemId: 'ci-2',
        menuItemId: 'm-noodle-beef',
        name: 'ก๋วยเตี๋ยวเรือเนื้อตุ๋นยาจีนพรีเมียม',
        unitPrice: 30,
        quantity: 1,
        totalPrice: 30,
        customOptions: {
          bowlSize: 'regular',
          noodleType: 'sen_mee',
          soupType: 'namtok',
          meats: ['beef_braised', 'beef_ball'],
          spicyLevel: 3,
          veggie: 'morning_glory',
          extraToppings: [],
        },
      },
      {
        cartItemId: 'ci-3',
        menuItemId: 'm-app-crackling',
        name: 'กากหมูโบราณเจียวสดกระเทียมกรอบ',
        unitPrice: 25,
        quantity: 1,
        totalPrice: 25,
      },
      {
        cartItemId: 'ci-4',
        menuItemId: 'm-des-kanom-tuay',
        name: 'ขนมถ้วยตะไลใบเตยโบราณ (1 คู่)',
        unitPrice: 16,
        quantity: 1,
        totalPrice: 16,
      },
      {
        cartItemId: 'ci-5',
        menuItemId: 'm-drk-black-tea',
        name: 'ชาดำเย็นใบชาอัสสัม',
        unitPrice: 25,
        quantity: 1,
        totalPrice: 25,
      },
    ],
  },
  {
    id: 'ord-102',
    orderNumber: '#TH-102',
    tableNumber: 5,
    createdAt: Date.now() - 6 * 60 * 1000,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: 'promptpay',
    totalBowls: 3,
    totalAmount: 110,
    items: [
      {
        cartItemId: 'ci-6',
        menuItemId: 'm-noodle-pork',
        name: 'ก๋วยเตี๋ยวเรือหมูอยุธยา',
        unitPrice: 25,
        quantity: 2,
        totalPrice: 50,
        customOptions: {
          bowlSize: 'regular',
          noodleType: 'sen_yai',
          soupType: 'tom_yum_namtok',
          meats: ['pork_slice', 'liver'],
          spicyLevel: 2,
          veggie: 'all',
          extraToppings: [{ id: 'top-1', name: 'กากหมูเจียวสดกรอบ', price: 20 }],
        },
      },
      {
        cartItemId: 'ci-7',
        menuItemId: 'm-noodle-beef',
        name: 'ก๋วยเตี๋ยวเรือเนื้อตุ๋นยาจีนพรีเมียม (ชามพิเศษ)',
        unitPrice: 75,
        quantity: 1,
        totalPrice: 75,
        customOptions: {
          bowlSize: 'special',
          noodleType: 'thin',
          soupType: 'namtok',
          meats: ['beef_slice', 'beef_braised', 'beef_ball'],
          spicyLevel: 4,
          veggie: 'all',
          extraToppings: [],
        },
      },
      {
        cartItemId: 'ci-8',
        menuItemId: 'm-drk-thai-tea',
        name: 'ชาไทยโบราณสูตรชักเข้มข้น',
        unitPrice: 30,
        quantity: 1,
        totalPrice: 30,
      },
    ],
  },
];

type SyncListener = () => void;

class StoreSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'ORDER_CREATED') {
            sound.playOrderPlaced();
          } else if (event.data?.type === 'ORDER_STATUS_CHANGED' && event.data?.status === 'ready') {
            sound.playFoodReady();
          } else if (event.data?.type === 'PAYMENT_CONFIRMED') {
            sound.playPaymentSuccess();
          }
          this.notifyListeners();
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment, falling back to storage events', e);
      }

      window.addEventListener('storage', (event) => {
        if (event.key?.startsWith('ruea_thong_')) {
          this.notifyListeners();
        }
      });
    }
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in store sync listener:', err);
      }
    });
  }

  private postChannel(data: { type: string; [key: string]: unknown }) {
    try {
      this.channel?.postMessage(data);
    } catch (e) {
      console.warn('Could not post to channel', e);
    }
    this.notifyListeners();
  }

  // --- MENU ITEMS ---
  getMenuItems(): MenuItem[] {
    if (typeof window === 'undefined') return INITIAL_MENU_ITEMS;
    const data = localStorage.getItem(STORAGE_KEY_MENU);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(INITIAL_MENU_ITEMS));
      return INITIAL_MENU_ITEMS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  }

  saveMenuItem(item: MenuItem): void {
    const items = this.getMenuItems();
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
    this.postChannel({ type: 'MENU_UPDATED', itemId: item.id });
  }

  deleteMenuItem(itemId: string): void {
    const items = this.getMenuItems().filter((i) => i.id !== itemId);
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
    this.postChannel({ type: 'MENU_UPDATED', itemId });
  }

  toggleItemAvailability(itemId: string): void {
    const items = this.getMenuItems();
    const item = items.find((i) => i.id === itemId);
    if (item) {
      item.isAvailable = !item.isAvailable;
      localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
      this.postChannel({ type: 'MENU_UPDATED', itemId });
    }
  }

  // --- ORDERS ---
  getOrders(): Order[] {
    if (typeof window === 'undefined') return SEED_ORDERS;
    const data = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(SEED_ORDERS));
      return SEED_ORDERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return SEED_ORDERS;
    }
  }

  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Order {
    const orders = this.getOrders();
    const nextNum = 101 + orders.length;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: `#TH-${nextNum}`,
      createdAt: Date.now(),
    };

    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    sound.playOrderPlaced();
    this.postChannel({ type: 'ORDER_CREATED', orderId: newOrder.id, table: newOrder.tableNumber });
    return newOrder;
  }

  updateOrderStatus(orderId: string, status: OrderStatus): void {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
      if (status === 'ready') {
        sound.playFoodReady();
      }
      this.postChannel({ type: 'ORDER_STATUS_CHANGED', orderId, status, table: order.tableNumber });
    }
  }

  updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus, slipUrl?: string): void {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.paymentStatus = paymentStatus;
      if (slipUrl) {
        order.slipUrl = slipUrl;
      }
      if (paymentStatus === 'paid') {
        order.paidAt = Date.now();
        sound.playPaymentSuccess();
      }
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
      this.postChannel({ type: 'PAYMENT_CONFIRMED', orderId, paymentStatus, table: order.tableNumber });
    }
  }

  // Mark all active orders for a table as paid and served
  checkoutTable(tableNumber: number): void {
    const orders = this.getOrders();
    let updated = false;
    orders.forEach((o) => {
      if (o.tableNumber === tableNumber && (o.paymentStatus !== 'paid' || o.status !== 'served')) {
        o.paymentStatus = 'paid';
        o.status = 'served';
        if (!o.paidAt) o.paidAt = Date.now();
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
      sound.playPaymentSuccess();
      this.postChannel({ type: 'TABLE_CHECKOUT', tableNumber });
    }
  }

  // --- STORE SETTINGS ---
  getSettings(): StoreSettings {
    if (typeof window === 'undefined') return INITIAL_STORE_SETTINGS;
    const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(INITIAL_STORE_SETTINGS));
      return INITIAL_STORE_SETTINGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_STORE_SETTINGS;
    }
  }

  saveSettings(settings: StoreSettings): void {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    this.postChannel({ type: 'SETTINGS_UPDATED' });
  }

  // Reset to initial demo data
  resetDemoData(): void {
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(INITIAL_MENU_ITEMS));
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(SEED_ORDERS));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(INITIAL_STORE_SETTINGS));
    this.postChannel({ type: 'RESET_DATA' });
  }
}

export const storeSync = new StoreSyncService();
