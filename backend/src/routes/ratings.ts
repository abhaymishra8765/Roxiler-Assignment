
import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const ratingValidators = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be integer 1-5')
];


router.post(
  '/stores/:storeId/rating',
  authenticate,
  ratingValidators,
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const userId = req.user?.userId;
      const storeId = Number(req.params.storeId);
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const store = await prisma.store.findUnique({ where: { id: storeId } });
      if (!store) return res.status(404).json({ error: 'Store not found' });

      const ratingValue = Number(req.body.rating);

      
      const r = await prisma.rating.upsert({
        where: { userId_storeId: { userId: Number(userId), storeId } }, 
        update: { rating: ratingValue },
        create: { userId: Number(userId), storeId, rating: ratingValue }
      });

      return res.json({ rating: r });
    } catch (err: any) {
      console.error('POST rating error', err);
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  }
);


export default router;
