import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { store, findOrderById, nextNotificationId } from '../services/store.js';

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

router.get('/', authenticate, (_req, res) => {
  res.json(store.orders);
});

router.get('/:id', authenticate, (req, res) => {
  const order = findOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(order);
});

router.post('/', validate(createOrderSchema), (req, res) => {
  const order = req.body;
  store.orders.unshift(order);
  store.notifications.unshift({
    id: nextNotificationId(),
    type: 'order',
    title: 'New Order Received',
    message: `Order ${order.id} from ${order.customer.name}`,
    time: 'Just now',
    read: false,
  });
  res.status(201).json(order);
});

router.patch('/:id/status', authenticate, validate(z.object({ status: z.enum(['Pending', 'Processing', 'Completed', 'Cancelled']) })), (req, res) => {
  const order = findOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  order.status = req.body.status;
  res.json(order);
});

router.delete('/:id', authenticate, (req, res) => {
  const idx = store.orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  store.orders.splice(idx, 1);
  res.json({ message: 'Order deleted' });
});

router.get('/customer/:name', authenticate, (req, res) => {
  const customerOrders = store.orders.filter(
    (o) => o.customer.name.toLowerCase().includes(req.params.name.toLowerCase()),
  );
  res.json(customerOrders);
});

export default router;
