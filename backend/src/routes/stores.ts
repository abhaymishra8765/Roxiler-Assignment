import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';

const prisma = new PrismaClient();
const router = express.Router();


router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { name, address, page = '1', pageSize = '50', sortBy = 'name', sortDir = 'asc' } = req.query as any;
    const pageNum = Math.max(1, parseInt(page + '', 10));
    const size = Math.max(1, Math.min(200, parseInt(pageSize + '', 10)));
    const skip = (pageNum - 1) * size;

    const where: any = {};
    if (name && name.trim()) where.name = { contains: (name as string).trim(), mode: 'insensitive' };
    if (address && address.trim()) where.address = { contains: (address as string).trim(), mode: 'insensitive' };

   
    const [total, stores] = await Promise.all([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sortBy]: sortDir === 'desc' ? 'desc' : 'asc' } as any,
        select: { id: true, name: true, email: true, address: true, ownerId: true, createdAt: true }
      })
    ]);

    const storeIds = stores.map(s => s.id);

   
    const agg = storeIds.length
      ? await prisma.rating.groupBy({
          by: ['storeId'],
          where: { storeId: { in: storeIds } },
          _avg: { rating: true },
        })
      : [];

    const avgMap: Record<number, number | null> = {};
    for (const a of agg) avgMap[a.storeId] = a._avg?.rating ?? null;

    
    let userId: number | null = null;
    try {
       if ((req as any).user && (req as any).user.userId) {
        userId = (req as any).user.userId;
      }
    } catch (e) {
      userId = null;
    }

   
    let userRatingsMap: Record<number, number> = {};
    if (userId) {
      const userRatings = storeIds.length
        ? await prisma.rating.findMany({
            where: { storeId: { in: storeIds }, userId: Number(userId) },
            select: { storeId: true, rating: true },
          })
        : [];
      for (const ur of userRatings) userRatingsMap[ur.storeId] = ur.rating;
    }

    const result = stores.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      ownerId: s.ownerId,
      avgRating: avgMap[s.id] ?? null,
      userSubmittedRating: userRatingsMap[s.id] ?? null
    }));

    res.json({ total, page: pageNum, pageSize: size, stores: result });
  } catch (err: any) {
    console.error('GET /stores error', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});



router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const store = await prisma.store.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, address: true, ownerId: true, createdAt: true },
    });
    if (!store) return res.status(404).json({ error: 'Store not found' });

    
    const ag = await prisma.rating.aggregate({ where: { storeId: id }, _avg: { rating: true }, _count: { rating: true } });
    const averageRating = ag._avg?.rating ?? null;
    const ratingCount = ag._count?.rating ?? 0;

   
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 10);
    const ratings = await prisma.rating.findMany({
      where: { storeId: id },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: { id: true, rating: true, userId: true, createdAt: true, updatedAt: true, user: { select: { id: true, name: true, email: true } } }
    });

    res.json({ store, averageRating, ratingCount, ratings, page, pageSize });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.post('/:id/rating', authenticate, async (req: AuthRequest, res) => {
  // inside router.post('/:id/rating', authenticate, async (req, res) => { ... })
try {
  const storeId = Number(req.params.id);
  const userId = req.user!.userId;
  const rating = Number(req.body.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
  }

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return res.status(404).json({ error: 'Store not found' });

  // Try to find existing rating
  const existing = await prisma.rating.findUnique({
    where: {
      userId_storeId: { userId, storeId } // this is the typical composite unique where shape
    }
  });

  let createdOrUpdated;
  if (existing) {
    createdOrUpdated = await prisma.rating.update({
      where: { id: existing.id },
      data: { rating, updatedAt: new Date() }
    });
  } else {
    createdOrUpdated = await prisma.rating.create({
      data: { userId, storeId, rating }
    });
  }

  const agg = await prisma.rating.aggregate({ where: { storeId }, _avg: { rating: true }, _count: { rating: true } });
  const averageRating = agg._avg?.rating ?? null;
  const ratingCount = agg._count?.rating ?? 0;

  res.status(201).json({ rating: createdOrUpdated, averageRating, ratingCount });
} catch (err: any) {
  console.error('rating post error', err);
  res.status(500).json({ error: err.message || 'Server error' });
}
});


router.put('/:id/rating', authenticate, async (req: AuthRequest, res) => {
  // reuse the POST handler logic
  return router.handle(req, res, () => {});
});


router.get('/:id/ratings', authenticate, async (req: AuthRequest, res) => {
  try {
    const storeId = Number(req.params.id);
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return res.status(404).json({ error: 'Store not found' });

    // allow if owner or admin
    const requesterRole = req.user!.role;
    const requesterId = req.user!.userId;
    if (requesterRole !== 'SYSTEM_ADMIN' && store.ownerId !== requesterId) {
      return res.status(403).json({ error: 'Forbidden. Only store owner or admin can view ratings list for this store.' });
    }

    const ratings = await prisma.rating.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, rating: true, userId: true, user: { select: { id: true, name: true, email: true } }, createdAt: true },
    });

    // compute average
    const agg = await prisma.rating.aggregate({ where: { storeId }, _avg: { rating: true }, _count: { rating: true } });
    const averageRating = agg._avg?.rating ?? null;
    const ratingCount = agg._count?.rating ?? 0;

    res.json({ storeId, averageRating, ratingCount, ratings });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/owner/stores', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    // get stores owned by this user
    const stores = await prisma.store.findMany({
      where: { ownerId: Number(userId) },
      select: { id: true, name: true, email: true, address: true, createdAt: true }
    });

    const storeIds = stores.map(s => s.id);
    const agg = storeIds.length
      ? await prisma.rating.groupBy({
          by: ['storeId'],
          where: { storeId: { in: storeIds } },
          _avg: { rating: true },
          _count: { rating: true }
        })
      : [];

    const map: Record<number, { avg: number | null; count: number }> = {};
    for (const a of agg) {
      map[a.storeId] = { avg: a._avg?.rating ?? null, count: a._count?.rating ?? 0 };
    }

    const result = stores.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      averageRating: map[s.id]?.avg ?? null,
      ratingCount: map[s.id]?.count ?? 0
    }));

    res.json({ stores: result });
  } catch (err: any) {
    console.error('GET /owner/stores error', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
