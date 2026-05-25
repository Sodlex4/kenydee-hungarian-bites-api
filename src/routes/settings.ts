import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getSettings, upsertSettings, getPreferences, upsertPreferences } from '../services/store.js';

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

router.get('/', async (_req, res, next) => {
  try {
    let settings = await getSettings();
    if (!settings) {
      settings = await upsertSettings({
        siteName: 'Hungarian Bites',
        siteDescription: 'Premium Hungarian Hot Dog Rolls',
        whatsapp: 'https://wa.me/254759233065',
        email: 'Kennedygikonyo3@gmail.com',
        currency: 'KES',
        deliveryFee: 0,
        freeDeliveryMin: 200,
        deliveryTime: '2 hours',
        deliveryRadius: "Murang'a Town",
      });
    }
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

router.put('/', authenticate, validate(settingsSchema), async (req, res, next) => {
  try {
    const settings = await upsertSettings(req.body);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

router.get('/preferences', authenticate, async (_req, res, next) => {
  try {
    let prefs = await getPreferences();
    if (!prefs) {
      prefs = await upsertPreferences({
        notifications: true,
        emailAlerts: true,
        orderUpdates: true,
        marketingEmails: false,
      });
    }
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

router.patch('/preferences', authenticate, validate(preferencesSchema), async (req, res, next) => {
  try {
    const prefs = await upsertPreferences(req.body);
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

export default router;
