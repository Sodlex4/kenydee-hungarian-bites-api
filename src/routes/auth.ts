import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/env.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const ADMIN_EMAIL = 'admin@hungarianbites.com';
// default password: "admin" — should be changed on first login in production
let adminPasswordHash: string | null = null;

async function getPasswordHash(): Promise<string> {
  if (!adminPasswordHash) {
    adminPasswordHash = await bcrypt.hash('admin', 10);
  }
  return adminPasswordHash;
}

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
    const hash = await getPasswordHash();
    const valid = await bcrypt.compare(password, hash);
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

router.post('/change-password', validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const hash = await getPasswordHash();
    const valid = await bcrypt.compare(currentPassword, hash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }
    adminPasswordHash = await bcrypt.hash(newPassword, 10);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
