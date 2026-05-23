import mysql from 'mysql2/promise';
import { config } from '../config/env.js';

let pool: mysql.Pool;

export async function getPool(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

export async function initDatabase(): Promise<void> {
  const bootstrap = await mysql.createConnection({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
  });

  await bootstrap.execute(
    `CREATE DATABASE IF NOT EXISTS \`${config.dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await bootstrap.end();

  const p = await getPool();

  await p.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'General',
      stock INT NOT NULL DEFAULT 0,
      image TEXT NOT NULL DEFAULT '/placeholder.svg',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(50) PRIMARY KEY,
      customer JSON NOT NULL,
      items JSON NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date DATE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      method VARCHAR(50) DEFAULT NULL,
      delivery_address TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL DEFAULT '',
      phone VARCHAR(50) NOT NULL DEFAULT '',
      orders INT NOT NULL DEFAULT 0,
      total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
      last_order DATE DEFAULT NULL,
      joined DATE DEFAULT NULL
    )
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      time VARCHAR(100) NOT NULL,
      \`read\` BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY DEFAULT 1,
      site_name VARCHAR(255) NOT NULL DEFAULT 'Hungarian Bites',
      site_description TEXT NOT NULL DEFAULT '',
      whatsapp VARCHAR(255) NOT NULL DEFAULT '',
      email VARCHAR(255) NOT NULL DEFAULT '',
      currency VARCHAR(10) NOT NULL DEFAULT 'KES',
      delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
      free_delivery_min DECIMAL(10,2) NOT NULL DEFAULT 0,
      delivery_time VARCHAR(100) NOT NULL DEFAULT '',
      delivery_radius VARCHAR(255) NOT NULL DEFAULT ''
    )
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS preferences (
      id INT PRIMARY KEY DEFAULT 1,
      notifications BOOLEAN NOT NULL DEFAULT TRUE,
      email_alerts BOOLEAN NOT NULL DEFAULT TRUE,
      order_updates BOOLEAN NOT NULL DEFAULT TRUE,
      marketing_emails BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL
    )
  `);

  console.log('[db] Database schema initialized');
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}
