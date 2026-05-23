import bcrypt from 'bcryptjs';
import { getPool } from './services/db.js';
import type { Order, Customer, Product, Notification } from './types/index.js';

const sampleOrders: Order[] = [
  {
    id: '#HBT-1001',
    customer: { name: 'John Doe', email: 'john@example.com', phone: '+254700123456' },
    items: [{ name: '5 Hot Dog Rolls', quantity: 2, price: 350 }],
    amount: 700,
    date: '2026-05-20',
    status: 'Completed',
    method: 'M-Pesa',
    deliveryAddress: "Murang'a Town, Near Post Office",
  },
  {
    id: '#HBT-1002',
    customer: { name: 'Sarah Wanjiku', email: 'sarah@example.com', phone: '+254700234567' },
    items: [{ name: '10 Hot Dog Rolls', quantity: 1, price: 650 }],
    amount: 650,
    date: '2026-05-21',
    status: 'Pending',
    method: 'Cash',
    deliveryAddress: "Kahuro Street, Murang'a",
  },
  {
    id: '#HBT-1003',
    customer: { name: 'Mike Omondi', email: 'mike@example.com', phone: '+254700345678' },
    items: [{ name: '20 Hot Dog Rolls', quantity: 1, price: 1200 }],
    amount: 1200,
    date: '2026-05-21',
    status: 'Processing',
    method: 'M-Pesa',
    deliveryAddress: "Kenyatta Highway, Murang'a",
  },
  {
    id: '#HBT-1004',
    customer: { name: 'Grace Mutua', email: '', phone: '+254700456789' },
    items: [
      { name: '5 Hot Dog Rolls', quantity: 1, price: 350 },
      { name: '10 Hot Dog Rolls', quantity: 1, price: 650 },
    ],
    amount: 1000,
    date: '2026-05-22',
    status: 'Completed',
    method: 'M-Pesa',
    deliveryAddress: "Kiria-ini, Murang'a",
  },
  {
    id: '#HBT-1005',
    customer: { name: 'Peter Kamau', email: 'peter@example.com', phone: '+254700567890' },
    items: [{ name: '20 Hot Dog Rolls', quantity: 2, price: 1200 }],
    amount: 2400,
    date: '2026-05-22',
    status: 'Completed',
    method: 'M-Pesa',
    deliveryAddress: "Maragua Ridge, Murang'a",
  },
  {
    id: '#HBT-1006',
    customer: { name: 'Ann Njeri', email: '', phone: '+254700678901' },
    items: [{ name: '10 Hot Dog Rolls', quantity: 1, price: 650 }],
    amount: 650,
    date: '2026-05-23',
    status: 'Pending',
    method: 'Cash',
    deliveryAddress: "Town Center, Murang'a",
  },
  {
    id: '#HBT-1007',
    customer: { name: 'James Kiprop', email: 'james@example.com', phone: '+254700789012' },
    items: [{ name: '5 Hot Dog Rolls', quantity: 3, price: 350 }],
    amount: 1050,
    date: '2026-05-23',
    status: 'Pending',
    method: 'M-Pesa',
    deliveryAddress: "Mumbi Estate, Murang'a",
  },
];

const sampleCustomers: Customer[] = [
  { id: 'C-001', name: 'John Doe', email: 'john@example.com', phone: '+254700123456', orders: 1, totalSpent: 700, lastOrder: '2026-05-20', joined: '2026-05-01' },
  { id: 'C-002', name: 'Sarah Wanjiku', email: 'sarah@example.com', phone: '+254700234567', orders: 1, totalSpent: 650, lastOrder: '2026-05-21', joined: '2026-04-15' },
  { id: 'C-003', name: 'Mike Omondi', email: 'mike@example.com', phone: '+254700345678', orders: 1, totalSpent: 1200, lastOrder: '2026-05-21', joined: '2026-05-10' },
  { id: 'C-004', name: 'Grace Mutua', email: '', phone: '+254700456789', orders: 1, totalSpent: 1000, lastOrder: '2026-05-22', joined: '2026-05-22' },
  { id: 'C-005', name: 'Peter Kamau', email: 'peter@example.com', phone: '+254700567890', orders: 1, totalSpent: 2400, lastOrder: '2026-05-22', joined: '2026-03-20' },
  { id: 'C-006', name: 'Ann Njeri', email: '', phone: '+254700678901', orders: 1, totalSpent: 650, lastOrder: '2026-05-23', joined: '2026-05-23' },
  { id: 'C-007', name: 'James Kiprop', email: 'james@example.com', phone: '+254700789012', orders: 1, totalSpent: 1050, lastOrder: '2026-05-23', joined: '2026-05-18' },
];

const sampleProducts: Product[] = [
  { id: 1, name: '5 Hot Dog Rolls', price: 350, category: 'Packages', stock: 120, image: '/image/hotdog.webp', createdAt: '2026-01-01' },
  { id: 2, name: '10 Hot Dog Rolls', price: 650, category: 'Packages', stock: 85, image: '/image/cheese-dog-bread-rolls.webp', createdAt: '2026-01-01' },
  { id: 3, name: '20 Hot Dog Rolls', price: 1200, category: 'Packages', stock: 15, image: '/image/hotdog.webp', createdAt: '2026-01-01' },
];

const sampleNotifications: Notification[] = [
  { id: 1, type: 'order', title: 'New Order Received', message: 'Order #HBT-1002 from Sarah Wanjiku', time: '2 hours ago', read: false },
  { id: 2, type: 'order', title: 'New Order Received', message: 'Order #HBT-1006 from Ann Njeri', time: '5 hours ago', read: false },
  { id: 3, type: 'order', title: 'New Order Received', message: 'Order #HBT-1007 from James Kiprop', time: '6 hours ago', read: false },
  { id: 4, type: 'info', title: 'Order Completed', message: 'Order #HBT-1004 marked as Completed', time: '1 day ago', read: true },
  { id: 5, type: 'info', title: 'Order Completed', message: 'Order #HBT-1005 marked as Completed', time: '1 day ago', read: true },
];

export async function seedData(): Promise<void> {
  const p = await getPool();

  const [[productCount]] = await p.execute<any[]>('SELECT COUNT(*) AS cnt FROM products');
  if (productCount.cnt > 0) {
    console.log('[seed] Data already exists, skipping seed');
    return;
  }

  for (const product of sampleProducts) {
    await p.execute(
      'INSERT INTO products (id, name, price, category, stock, image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [product.id, product.name, product.price, product.category, product.stock, product.image, product.createdAt],
    );
  }

  for (const order of sampleOrders) {
    await p.execute(
      `INSERT INTO orders (id, customer, items, amount, date, status, method, delivery_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        JSON.stringify(order.customer),
        JSON.stringify(order.items),
        order.amount,
        order.date,
        order.status,
        order.method ?? null,
        order.deliveryAddress,
      ],
    );
  }

  for (const customer of sampleCustomers) {
    await p.execute(
      `INSERT INTO customers (id, name, email, phone, orders, total_spent, last_order, joined)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer.id, customer.name, customer.email, customer.phone, customer.orders, customer.totalSpent, customer.lastOrder, customer.joined],
    );
  }

  for (const notif of sampleNotifications) {
    await p.execute(
      'INSERT INTO notifications (id, type, title, message, time, `read`) VALUES (?, ?, ?, ?, ?, ?)',
      [notif.id, notif.type, notif.title, notif.message, notif.time, notif.read],
    );
  }

  await p.execute(
    `INSERT INTO settings (id, site_name, site_description, whatsapp, email, currency, delivery_fee, free_delivery_min, delivery_time, delivery_radius)
     VALUES (1, 'Hungarian Bites', 'Premium Hungarian Hot Dog Rolls', 'https://wa.me/254759233065', 'Kennedygikonyo3@gmail.com', 'KES', 0, 200, '2 hours', 'Murang\\'a Town')`,
  );

  await p.execute(
    `INSERT INTO preferences (id, notifications, email_alerts, order_updates, marketing_emails)
     VALUES (1, TRUE, TRUE, TRUE, FALSE)`,
  );

  const defaultHash = await bcrypt.hash('admin', 10);
  await p.execute(
    `INSERT INTO admins (email, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ['admin@hungarianbites.com', defaultHash],
  );

  console.log(`[seed] Loaded ${sampleOrders.length} orders, ${sampleCustomers.length} customers, ${sampleProducts.length} products`);
}
