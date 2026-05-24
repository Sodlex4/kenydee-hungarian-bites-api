import bcrypt from 'bcryptjs';
import { getPool } from './services/db.js';

const sampleProducts = [
  { id: 1, name: '5 Hot Dog Rolls', price: 350, category: 'Packages', stock: 120, image: '/image/hotdog.webp', createdAt: '2026-01-01' },
  { id: 2, name: '10 Hot Dog Rolls', price: 650, category: 'Packages', stock: 85, image: '/image/cheese-dog-bread-rolls.webp', createdAt: '2026-01-01' },
  { id: 3, name: '20 Hot Dog Rolls', price: 1200, category: 'Packages', stock: 15, image: '/image/hotdog.webp', createdAt: '2026-01-01' },
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

  await p.execute(
    `INSERT INTO settings (id, site_name, site_description, whatsapp, email, currency, delivery_fee, free_delivery_min, delivery_time, delivery_radius)
     VALUES (1, 'Hungarian Bites', 'Premium Hungarian Hot Dog Rolls', 'https://wa.me/254759233065', 'Kennedygikonyo3@gmail.com', 'KES', 0, 200, '2 hours', 'Murang\\'a Town')`,
  );

  await p.execute(
    `INSERT INTO preferences (id, notifications, email_alerts, order_updates, marketing_emails)
     VALUES (1, TRUE, TRUE, TRUE, FALSE)`,
  );

  const defaultHash = await bcrypt.hash('admin00', 10);
  await p.execute(
    `INSERT INTO admins (email, password_hash, token_version) VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), token_version = token_version + 1`,
    ['admin@hungarianbites.com', defaultHash],
  );

  console.log('[seed] Loaded 3 products, settings, preferences, admin account');
}
