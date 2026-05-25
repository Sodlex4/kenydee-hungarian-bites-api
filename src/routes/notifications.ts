import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { config } from '../config/env.js';
import {
  getAllNotifications, markNotificationRead,
  markAllNotificationsRead, deleteNotification, insertNotification,
} from '../services/store.js';
import { emitNotificationChanged, onNotificationChanged } from '../services/notificationEvents.js';
import type { AuthPayload } from '../types/index.js';

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

router.get('/stream', async (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  try {
    jwt.verify(token, config.jwtSecret) as AuthPayload;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const sendUpdate = async () => {
    try {
      const notifications = await getAllNotifications();
      res.write(`event: update\ndata: ${JSON.stringify(notifications)}\n\n`);
    } catch {
      // connection may have closed
    }
  };

  await sendUpdate();

  const cleanup = onNotificationChanged(sendUpdate);

  const heart = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    cleanup();
    clearInterval(heart);
  });
});

router.post('/', validate(notificationSchema), async (req, res, next) => {
  try {
    const id = await insertNotification(req.body);
    emitNotificationChanged();
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
    emitNotificationChanged();
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
    emitNotificationChanged();
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
    emitNotificationChanged();
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
