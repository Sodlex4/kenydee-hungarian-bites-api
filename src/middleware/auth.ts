import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { getAdminByEmail } from '../services/store.js';
import type { AuthPayload } from '../types/index.js';

const ADMIN_EMAIL = 'admin@hungarianbites.com';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    const admin = await getAdminByEmail(ADMIN_EMAIL);
    if (!admin || admin.tokenVersion !== payload.tokenVersion) {
      res.status(401).json({ error: 'Token revoked. Please log in again.' });
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
