import type { Order, Customer, Product, Notification, AdminSettings, AdminPreferences } from '../types/index.js';

export const store = {
  orders: [] as Order[],
  customers: [] as Customer[],
  products: [] as Product[],
  notifications: [] as Notification[],
  settings: null as AdminSettings | null,
  preferences: null as AdminPreferences | null,
};

export function findOrderById(id: string): Order | undefined {
  return store.orders.find((o) => o.id === id);
}

export function nextProductId(): number {
  return store.products.length > 0 ? Math.max(...store.products.map((p) => p.id)) + 1 : 1;
}

export function nextNotificationId(): number {
  return store.notifications.length > 0 ? Math.max(...store.notifications.map((n) => n.id)) + 1 : 1;
}
