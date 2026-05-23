import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { store, nextProductId } from '../services/store.js';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string().default('General'),
  stock: z.number().int().min(0).default(0),
  image: z.string().default('/placeholder.svg'),
});

router.get('/', (_req, res) => {
  res.json(store.products);
});

router.get('/:id', (req, res) => {
  const product = store.products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(product);
});

router.post('/', authenticate, validate(productSchema), (req, res) => {
  const product = { id: nextProductId(), ...req.body, createdAt: new Date().toISOString() };
  store.products.push(product);
  res.status(201).json(product);
});

router.put('/:id', authenticate, validate(productSchema), (req, res) => {
  const idx = store.products.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  store.products[idx] = { ...store.products[idx], ...req.body };
  res.json(store.products[idx]);
});

router.delete('/:id', authenticate, (req, res) => {
  const idx = store.products.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  store.products.splice(idx, 1);
  res.json({ message: 'Product deleted' });
});

export default router;
