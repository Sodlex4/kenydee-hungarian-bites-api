import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { store } from '../services/store.js';

const router = Router();

router.get('/', authenticate, (_req, res) => {
  res.json(store.notifications);
});

router.patch('/:id/read', authenticate, (req, res) => {
  const notification = store.notifications.find((n) => n.id === Number(req.params.id));
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  notification.read = true;
  res.json(notification);
});

router.patch('/read-all', authenticate, (_req, res) => {
  store.notifications.forEach((n) => { n.read = true; });
  res.json({ message: 'All notifications marked as read' });
});

router.delete('/:id', authenticate, (req, res) => {
  const idx = store.notifications.findIndex((n) => n.id === Number(req.params.id));
  if (idx === -1) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  store.notifications.splice(idx, 1);
  res.json({ message: 'Notification deleted' });
});

export default router;
