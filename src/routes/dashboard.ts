import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { store } from '../services/store.js';

const router = Router();

router.get('/', authenticate, (_req, res) => {
  const orders = store.orders;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;

  const revenueMap = new Map<string, number>();
  orders.forEach((o) => {
    revenueMap.set(o.date, (revenueMap.get(o.date) || 0) + o.amount);
  });
  const revenueData = Array.from(revenueMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const statusCounts = new Map<string, number>();
  orders.forEach((o) => {
    statusCounts.set(o.status, (statusCounts.get(o.status) || 0) + 1);
  });
  const orderStatusData = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

  res.json({
    totalOrders,
    totalRevenue,
    totalCustomers: store.customers.length,
    pendingOrders,
    revenueData,
    orderStatusData,
  });
});

export default router;
