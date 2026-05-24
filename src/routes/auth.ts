import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getAdminByEmail, upsertAdminPassword } from '../services/store.js';

const router = Router();

const ADMIN_EMAIL = 'admin@hungarianbites.com';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (email !== ADMIN_EMAIL) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const admin = await getAdminByEmail(ADMIN_EMAIL);
    if (!admin) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { userId: '1', role: 'admin' },
      config.jwtSecret,
      { expiresIn: '7d' as const },
    );
    res.json({ token, user: { email: ADMIN_EMAIL, role: 'admin' } });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.post('/change-password', authenticate, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await getAdminByEmail(ADMIN_EMAIL);
    if (!admin) {
      res.status(401).json({ error: 'Admin not found' });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await upsertAdminPassword(ADMIN_EMAIL, newHash);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
