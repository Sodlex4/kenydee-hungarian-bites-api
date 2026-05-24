import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getAdminByEmail,
  upsertAdminPassword,
  createRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} from '../services/store.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

const ADMIN_EMAIL = 'admin@hungarianbites.com';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
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
    const accessToken = jwt.sign(
      { userId: '1', role: 'admin', tokenVersion: admin.tokenVersion },
      config.jwtSecret,
      { expiresIn: '15m' },
    );
    const refreshToken = await createRefreshToken(ADMIN_EMAIL);
    res.json({ accessToken, refreshToken, user: { email: ADMIN_EMAIL, role: 'admin' } });
  } catch (err) {
    next(err);
  }
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const record = await validateRefreshToken(refreshToken);
    if (!record) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }
    const admin = await getAdminByEmail(ADMIN_EMAIL);
    if (!admin) {
      res.status(401).json({ error: 'Admin not found' });
      return;
    }
    await revokeRefreshToken(refreshToken);
    const newAccessToken = jwt.sign(
      { userId: '1', role: 'admin', tokenVersion: admin.tokenVersion },
      config.jwtSecret,
      { expiresIn: '15m' },
    );
    const newRefreshToken = await createRefreshToken(ADMIN_EMAIL);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
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
    await revokeAllRefreshTokens(ADMIN_EMAIL);
    res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    next(err);
  }
});

export default router;
