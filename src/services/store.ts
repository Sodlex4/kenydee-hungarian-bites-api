import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from './db.js';
import type {
  Order, Customer, Product, Notification,
  AdminSettings, AdminPreferences, DashboardStats,
} from '../types/index.js';

// ── helpers ──────────────────────────────────────────

function toCamelCase(rows: RowDataPacket[]): any[] {
  return rows.map((row) => {
    const out: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      out[camel] = row[key];
    }
    return out;
  });
}

// ── Products ─────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>('SELECT * FROM products ORDER BY id');
  return (toCamelCase(rows) as Product[]).map((p) => ({
    ...p,
    createdAt: formatDate((p as any).createdAt),
  }));
}

export async function getProductById(id: number): Promise<Product | null> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>('SELECT * FROM products WHERE id = ?', [id]);
  if (!rows.length) return null;
  const p = toCamelCase(rows)[0] as Product;
  return { ...p, createdAt: formatDate((p as any).createdAt) };
}

export async function insertProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const [result] = await (await getPool()).execute<ResultSetHeader>(
    'INSERT INTO products (name, price, category, stock, image) VALUES (?, ?, ?, ?, ?)',
    [data.name, data.price, data.category, data.stock, data.image],
  );
  return (await getProductById(result.insertId))!;
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product | null> {
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id' || key === 'createdAt') continue;
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    fields.push(`${col} = ?`);
    values.push(value);
  }
  if (!fields.length) return getProductById(id);
  values.push(id);
  await (await getPool()).execute(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    values,
  );
  return getProductById(id);
}

export async function deleteProduct(id: number): Promise<boolean> {
  const [result] = await (await getPool()).execute<ResultSetHeader>('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function nextProductId(): Promise<number> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM products');
  return rows[0].next_id;
}

// ── Orders ───────────────────────────────────────────

function formatDate(d: any): string {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(d).slice(0, 10);
}

function rowToOrder(row: RowDataPacket): Order {
  return {
    id: row.id,
    customer: typeof row.customer === 'string' ? JSON.parse(row.customer) : row.customer,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    amount: Number(row.amount),
    date: formatDate(row.date),
    status: row.status,
    method: row.method || undefined,
    deliveryAddress: row.delivery_address,
  };
}

export async function getAllOrders(): Promise<Order[]> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>('SELECT * FROM orders ORDER BY created_at DESC');
  return rows.map(rowToOrder);
}

export async function findOrderById(id: string): Promise<Order | null> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>('SELECT * FROM orders WHERE id = ?', [id]);
  return rows.length ? rowToOrder(rows[0]) : null;
}

export async function insertOrder(order: Order): Promise<void> {
  await (await getPool()).execute(
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

export async function updateOrderStatus(id: string, status: string): Promise<boolean> {
  const [result] = await (await getPool()).execute<ResultSetHeader>(
    'UPDATE orders SET status = ? WHERE id = ?', [status, id],
  );
  return result.affectedRows > 0;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const [result] = await (await getPool()).execute<ResultSetHeader>('DELETE FROM orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function getOrdersByCustomerName(name: string): Promise<Order[]> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>(
    "SELECT * FROM orders WHERE LOWER(JSON_UNQUOTE(JSON_EXTRACT(customer, '$.name'))) LIKE ?",
    [`%${name.toLowerCase()}%`],
  );
  return rows.map(rowToOrder);
}

// ── Customers ────────────────────────────────────────

function rowToCustomer(row: RowDataPacket): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    orders: row.orders,
    totalSpent: Number(row.total_spent),
    lastOrder: formatDate(row.last_order),
    joined: formatDate(row.joined),
  };
}

export async function getAllCustomers(): Promise<Customer[]> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>('SELECT * FROM customers ORDER BY joined DESC');
  return rows.map(rowToCustomer);
}

export async function upsertCustomerFromOrder(order: Order): Promise<void> {
  const name = order.customer.name;
  const [existing] = await (await getPool()).execute<RowDataPacket[]>(
    'SELECT * FROM customers WHERE name = ?', [name],
  );
  if (existing.length) {
    const c = existing[0];
    await (await getPool()).execute(
      `UPDATE customers SET orders = orders + 1, total_spent = total_spent + ?,
       last_order = GREATEST(last_order, ?) WHERE name = ?`,
      [order.amount, order.date, name],
    );
  } else {
    const id = `C-${Date.now().toString(36).toUpperCase()}`;
    await (await getPool()).execute(
      `INSERT INTO customers (id, name, email, phone, orders, total_spent, last_order, joined)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
      [id, name, order.customer.email, order.customer.phone, order.amount, order.date, order.date],
    );
  }
}

// ── Notifications ────────────────────────────────────

function rowToNotification(row: RowDataPacket): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    time: row.time,
    read: Boolean(row.read),
  };
}

export async function getAllNotifications(): Promise<Notification[]> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>('SELECT * FROM notifications ORDER BY id DESC');
  return rows.map(rowToNotification);
}

export async function insertNotification(data: Omit<Notification, 'id'>): Promise<number> {
  const [result] = await (await getPool()).execute<ResultSetHeader>(
    'INSERT INTO notifications (type, title, message, time, `read`) VALUES (?, ?, ?, ?, ?)',
    [data.type, data.title, data.message, data.time, data.read],
  );
  return result.insertId;
}

export async function markNotificationRead(id: number): Promise<boolean> {
  const [result] = await (await getPool()).execute<ResultSetHeader>(
    'UPDATE notifications SET `read` = TRUE WHERE id = ?', [id],
  );
  return result.affectedRows > 0;
}

export async function markAllNotificationsRead(): Promise<void> {
  await (await getPool()).execute('UPDATE notifications SET `read` = TRUE');
}

export async function deleteNotification(id: number): Promise<boolean> {
  const [result] = await (await getPool()).execute<ResultSetHeader>(
    'DELETE FROM notifications WHERE id = ?', [id],
  );
  return result.affectedRows > 0;
}

export async function nextNotificationId(): Promise<number> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM notifications');
  return rows[0].next_id;
}

// ── Settings ─────────────────────────────────────────

function rowToSettings(row: RowDataPacket): AdminSettings {
  return {
    siteName: row.site_name,
    siteDescription: row.site_description,
    whatsapp: row.whatsapp,
    email: row.email,
    currency: row.currency,
    deliveryFee: Number(row.delivery_fee),
    freeDeliveryMin: Number(row.free_delivery_min),
    deliveryTime: row.delivery_time,
    deliveryRadius: row.delivery_radius,
  };
}

export async function getSettings(): Promise<AdminSettings | null> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>('SELECT * FROM settings WHERE id = 1');
  return rows.length ? rowToSettings(rows[0]) : null;
}

export async function upsertSettings(data: AdminSettings): Promise<AdminSettings> {
  await (await getPool()).execute(
    `INSERT INTO settings (id, site_name, site_description, whatsapp, email, currency, delivery_fee, free_delivery_min, delivery_time, delivery_radius)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       site_name = VALUES(site_name),
       site_description = VALUES(site_description),
       whatsapp = VALUES(whatsapp),
       email = VALUES(email),
       currency = VALUES(currency),
       delivery_fee = VALUES(delivery_fee),
       free_delivery_min = VALUES(free_delivery_min),
       delivery_time = VALUES(delivery_time),
       delivery_radius = VALUES(delivery_radius)`,
    [data.siteName, data.siteDescription, data.whatsapp, data.email, data.currency, data.deliveryFee, data.freeDeliveryMin, data.deliveryTime, data.deliveryRadius],
  );
  return (await getSettings())!;
}

// ── Preferences ──────────────────────────────────────

function rowToPreferences(row: RowDataPacket): AdminPreferences {
  return {
    notifications: Boolean(row.notifications),
    emailAlerts: Boolean(row.email_alerts),
    orderUpdates: Boolean(row.order_updates),
    marketingEmails: Boolean(row.marketing_emails),
  };
}

export async function getPreferences(): Promise<AdminPreferences | null> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>('SELECT * FROM preferences WHERE id = 1');
  return rows.length ? rowToPreferences(rows[0]) : null;
}

export async function upsertPreferences(data: AdminPreferences): Promise<AdminPreferences> {
  await (await getPool()).execute(
    `INSERT INTO preferences (id, notifications, email_alerts, order_updates, marketing_emails)
     VALUES (1, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       notifications = VALUES(notifications),
       email_alerts = VALUES(email_alerts),
       order_updates = VALUES(order_updates),
       marketing_emails = VALUES(marketing_emails)`,
    [data.notifications, data.emailAlerts, data.orderUpdates, data.marketingEmails],
  );
  return (await getPreferences())!;
}

// ── Admins ───────────────────────────────────────────

export async function getAdminByEmail(email: string): Promise<{ email: string; passwordHash: string; tokenVersion: number } | null> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>(
    'SELECT email, password_hash, token_version FROM admins WHERE email = ?', [email],
  );
  return rows.length ? { email: rows[0].email, passwordHash: rows[0].password_hash, tokenVersion: rows[0].token_version } : null;
}

export async function upsertAdminPassword(email: string, passwordHash: string): Promise<void> {
  await (await getPool()).execute(
    'UPDATE admins SET password_hash = ?, token_version = token_version + 1 WHERE email = ?',
    [passwordHash, email],
  );
}

// ── Dashboard ────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const p = await getPool();

  const [[orderRow]] = await p.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS totalOrders, COALESCE(SUM(amount), 0) AS totalRevenue FROM orders',
  );
  const [[pendingRow]] = await p.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS pendingOrders FROM orders WHERE status = 'Pending'",
  );
  const [[customerRow]] = await p.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS totalCustomers FROM customers',
  );
  const [revenueRows] = await p.execute<RowDataPacket[]>(
    'SELECT date, SUM(amount) AS revenue FROM orders GROUP BY date ORDER BY date',
  );
  const [statusRows] = await p.execute<RowDataPacket[]>(
    'SELECT status, COUNT(*) AS count FROM orders GROUP BY status',
  );

  return {
    totalOrders: orderRow.totalOrders,
    totalRevenue: Number(orderRow.totalRevenue),
    totalCustomers: customerRow.totalCustomers,
    pendingOrders: pendingRow.pendingOrders,
    revenueData: revenueRows.map((r: any) => ({ date: formatDate(r.date), revenue: Number(r.revenue) })),
    orderStatusData: statusRows.map((r: any) => ({ status: r.status, count: r.count })),
  };
}
