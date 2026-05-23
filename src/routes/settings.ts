import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { store } from '../services/store.js';

const router = Router();

const settingsSchema = z.object({
  siteName: z.string().min(1),
  siteDescription: z.string(),
  whatsapp: z.string(),
  email: z.string().email(),
  currency: z.string().default('KES'),
  deliveryFee: z.number().min(0).default(0),
  freeDeliveryMin: z.number().min(0).default(0),
  deliveryTime: z.string(),
  deliveryRadius: z.string(),
});

const preferencesSchema = z.object({
  notifications: z.boolean(),
  emailAlerts: z.boolean(),
  orderUpdates: z.boolean(),
  marketingEmails: z.boolean(),
});

router.get('/', authenticate, (_req, res) => {
  if (!store.settings) {
    store.settings = {
      siteName: 'Hungarian Bites',
      siteDescription: 'Premium Hungarian Hot Dog Rolls',
      whatsapp: 'https://wa.me/254759233065',
      email: 'Kennedygikonyo3@gmail.com',
      currency: 'KES',
      deliveryFee: 0,
      freeDeliveryMin: 200,
      deliveryTime: '2 hours',
      deliveryRadius: 'Murang\'a Town',
    };
  }
  res.json(store.settings);
});

router.put('/', authenticate, validate(settingsSchema), (req, res) => {
  store.settings = req.body;
  res.json(store.settings);
});

router.get('/preferences', authenticate, (_req, res) => {
  if (!store.preferences) {
    store.preferences = {
      notifications: true,
      emailAlerts: true,
      orderUpdates: true,
      marketingEmails: false,
    };
  }
  res.json(store.preferences);
});

router.patch('/preferences', authenticate, validate(preferencesSchema), (req, res) => {
  store.preferences = req.body;
  res.json(store.preferences);
});

export default router;
