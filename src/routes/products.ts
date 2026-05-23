import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getAllProducts, getProductById, insertProduct, updateProduct, deleteProduct } from '../services/store.js';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string().default('General'),
  stock: z.number().int().min(0).default(0),
  image: z.string().default('/placeholder.svg'),
});

router.get('/', async (_req, res, next) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await getProductById(Number(req.params.id));
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, validate(productSchema), async (req, res, next) => {
  try {
    const product = await insertProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, validate(productSchema), async (req, res, next) => {
  try {
    const product = await updateProduct(Number(req.params.id), req.body);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const deleted = await deleteProduct(Number(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
