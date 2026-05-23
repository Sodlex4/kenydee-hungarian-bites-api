import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDashboardStats } from '../services/store.js';

const router = Router();

router.get('/', authenticate, async (_req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
