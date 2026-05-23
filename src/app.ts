import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initDatabase } from './services/db.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import customerRoutes from './routes/customers.js';
import notificationRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import { seedData } from './seed.js';

const app = express();

app.use(helmet({ contentSecurityPolicy: config.isDev ? false : undefined }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

let initialized = false;

export async function initApp(): Promise<void> {
  if (initialized) return;
  await initDatabase();
  await seedData();
  initialized = true;
  console.log('[app] Database initialized and seeded');
}

export default app;
