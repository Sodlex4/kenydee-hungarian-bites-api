import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getAllCustomers, getOrdersByCustomerName } from '../services/store.js';

const router = Router();

router.get('/', authenticate, async (_req, res, next) => {
  try {
    const customers = await getAllCustomers();
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

router.get('/:name/orders', authenticate, async (req, res, next) => {
  try {
    const customerOrders = await getOrdersByCustomerName(req.params.name);
    res.json(customerOrders);
  } catch (err) {
    next(err);
  }
});

export default router;
