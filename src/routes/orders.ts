import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getAllOrders, findOrderById, insertOrder,
  updateOrderStatus, deleteOrder, getOrdersByCustomerName,
  insertNotification,
} from '../services/store.js';

const router = Router();

const orderItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const createOrderSchema = z.object({
  id: z.string(),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email().or(z.literal('')),
    phone: z.string(),
  }),
  items: z.array(orderItemSchema).min(1),
  amount: z.number().positive(),
  date: z.string(),
  status: z.enum(['Pending', 'Processing', 'Completed', 'Cancelled']).default('Pending'),
  deliveryAddress: z.string().min(5),
});

router.get('/', authenticate, async (_req, res, next) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await findOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createOrderSchema), async (req, res, next) => {
  try {
    const order = req.body;
    await insertOrder(order);
    await insertNotification({
      type: 'order',
      title: 'New Order Received',
      message: `Order ${order.id} from ${order.customer.name}`,
      time: 'Just now',
      read: false,
    });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticate, validate(z.object({ status: z.enum(['Pending', 'Processing', 'Completed', 'Cancelled']) })), async (req, res, next) => {
  try {
    const updated = await updateOrderStatus(req.params.id, req.body.status);
    if (!updated) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const order = await findOrderById(req.params.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const deleted = await deleteOrder(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ message: 'Order deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/customer/:name', authenticate, async (req, res, next) => {
  try {
    const customerOrders = await getOrdersByCustomerName(req.params.name);
    res.json(customerOrders);
  } catch (err) {
    next(err);
  }
});

export default router;
