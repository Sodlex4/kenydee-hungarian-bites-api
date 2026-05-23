import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getAllNotifications, markNotificationRead,
  markAllNotificationsRead, deleteNotification, insertNotification,
} from '../services/store.js';

const notificationSchema = z.object({
  type: z.enum(['order', 'info', 'alert']),
  title: z.string().min(1),
  message: z.string().min(1),
  time: z.string(),
  read: z.boolean().default(false),
});

const router = Router();

router.get('/', authenticate, async (_req, res, next) => {
  try {
    const notifications = await getAllNotifications();
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(notificationSchema), async (req, res, next) => {
  try {
    const id = await insertNotification(req.body);
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const updated = await markNotificationRead(Number(req.params.id));
    if (!updated) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    const notifications = await getAllNotifications();
    const notif = notifications.find((n) => n.id === Number(req.params.id));
    res.json(notif);
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', authenticate, async (_req, res, next) => {
  try {
    await markAllNotificationsRead();
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const deleted = await deleteNotification(Number(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
