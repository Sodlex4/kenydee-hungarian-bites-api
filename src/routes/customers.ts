import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { store } from '../services/store.js';

const router = Router();

router.get('/', authenticate, (_req, res) => {
  res.json(store.customers);
});

router.get('/:name/orders', authenticate, (req, res) => {
  const customerOrders = store.orders.filter(
    (o) => o.customer.name.toLowerCase().includes(req.params.name.toLowerCase()),
  );
  res.json(customerOrders);
});

export default router;
