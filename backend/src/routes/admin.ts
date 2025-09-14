import express from 'express';
import { body, query, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

const sanitizeUser = (u: any) => {
  const { password, refreshToken, ...rest } = u;
  return rest;
};


const validate = (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};



router.post(
    '/users',
    authenticate,
    authorize(['SYSTEM_ADMIN']), 
    body('name').isString().isLength({ min: 20, max: 60 }).withMessage('Name must be 20-60 chars'),
    body('email').isEmail(),
    body('password')
      .isString()
      .isLength({ min: 8, max: 16 })
      .matches(/[A-Z]/).withMessage('Must include one uppercase')
      .matches(/\W/).withMessage('Must include one special character'),
    body('address').optional().isLength({ max: 400 }),
    body('role').optional().isIn(['NORMAL_USER', 'STORE_OWNER', 'SYSTEM_ADMIN']),
    async (req: AuthRequest, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
      try {
        const { name, email, password, address, role } = req.body;
        const requestedRole = (role || 'NORMAL_USER') as 'NORMAL_USER' | 'STORE_OWNER' | 'SYSTEM_ADMIN';
  
        if (requestedRole === 'SYSTEM_ADMIN' && req.user?.role !== 'SYSTEM_ADMIN') {
          return res.status(403).json({ error: 'Only SYSTEM_ADMIN can create another SYSTEM_ADMIN' });
        }
  
        
        const hashed = await bcrypt.hash(password, 10);
  
        const created = await prisma.user.create({
          data: {
            name,
            email,
            password: hashed,
            address,
            role: requestedRole,
          },
          select: { id: true, name: true, email: true, address: true, role: true, createdAt: true },
        });
  
        
        console.log(`Admin ${req.user?.userId} created user ${created.id} with role ${created.role}`);
  
        return res.status(201).json({ user: created });
      } catch (err: any) {
        if (err.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
        return res.status(500).json({ error: err.message });
      }
    }
  );
  

router.post(
  '/stores',
  authenticate,
  authorize(['SYSTEM_ADMIN']),
  body('name').isString().isLength({ min: 1 }),
  body('email').optional().isEmail(),
  body('address').optional().isLength({ max: 400 }),
  body('ownerId').optional().isInt(),
  async (req: AuthRequest, res) => {
    if (validate(req, res)) return;
    const { name, email, address, ownerId } = req.body;
    try {
      if (ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: Number(ownerId) } });
        if (!owner) return res.status(400).json({ error: 'ownerId does not exist' });
        if (owner.role !== 'STORE_OWNER') {
          return res.status(400).json({ error: 'ownerId user is not a STORE_OWNER' });
        }
      }

      const store = await prisma.store.create({
        data: { name, email, address, ownerId: ownerId ? Number(ownerId) : undefined },
        select: { id: true, name: true, email: true, address: true, ownerId: true, createdAt: true },
      });
      res.status(201).json(store);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);


router.get('/users', authenticate, authorize(['SYSTEM_ADMIN']), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20);
    const { name, email, address, role, sortField = 'id', sortOrder = 'asc' } = req.query;

    const where: any = {};
    if (name) where.name = { contains: String(name), mode: 'insensitive' };
    if (email) where.email = { contains: String(email), mode: 'insensitive' };
    if (address) where.address = { contains: String(address), mode: 'insensitive' };
    if (role) where.role = String(role);

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { [String(sortField)]: sortOrder === 'desc' ? 'desc' : 'asc' } as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, name: true, email: true, address: true, role: true, createdAt: true },
      }),
    ]);

    res.json({ total, page, pageSize, users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/stores', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SYSTEM_ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const { page = '1', pageSize = '20', name, address, sortBy = 'name', sortDir = 'asc' } = req.query as any;
    const pageNum = Math.max(1, parseInt(page + '', 10));
    const size = Math.max(1, Math.min(200, parseInt(pageSize + '', 10)));
    const skip = (pageNum - 1) * size;

    const where: any = {};
    if (name && name.trim()) where.name = { contains: name.trim(), mode: 'insensitive' };
    if (address && address.trim()) where.address = { contains: address.trim(), mode: 'insensitive' };

    const [total, stores] = await Promise.all([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sortBy]: sortDir === 'desc' ? 'desc' : 'asc' } as any,
        select: { id: true, name: true, email: true, address: true, ownerId: true, createdAt: true },
      }),
    ]);

    const storeIds = stores.map((s) => s.id);
    const agg = storeIds.length
      ? await prisma.rating.groupBy({
          by: ['storeId'],
          where: { storeId: { in: storeIds } },
          _avg: { rating: true },
        })
      : [];

    const avgMap: Record<number, number | null> = {};
    for (const a of agg) avgMap[a.storeId] = a._avg?.rating ?? null;

    const result = stores.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      ownerId: s.ownerId,
      averageRating: avgMap[s.id] ?? null,
    }));

    res.json({ total, page: pageNum, pageSize: size, stores: result });
  } catch (err: any) {
    console.error('GET /admin/stores error', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});


router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    // ensure only system admin can access
    if (req.user?.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // count users, stores, ratings
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.rating.count(),
    ]);

    // match the keys expected by your frontend
    res.json({
      totalUsers,
      totalStores,
      totalRatings,
    });
  } catch (err: any) {
    console.error('GET /admin/stats error', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/users/:id', authenticate, authorize(['SYSTEM_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user id' });

    // fetch basic user info (do not send password/refreshToken)
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, address: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // default response
    const payload: any = { user };

    // if store owner — gather store and rating info
    if (user.role === 'STORE_OWNER') {
      // fetch stores owned by this user
      const stores = await prisma.store.findMany({
        where: { ownerId: id },
        select: { id: true, name: true, email: true, address: true },
      });

      const storeIds = stores.map((s) => s.id);
      if (storeIds.length === 0) {
        payload.stores = stores;
        payload.storeRatings = [];
        payload.overallAverageRating = null;
        payload.overallRatingCount = 0;
      } else {
        // get per-store aggregates
        const agg = await prisma.rating.groupBy({
          by: ['storeId'],
          where: { storeId: { in: storeIds } },
          _avg: { rating: true },
          _count: { rating: true },
        });

        // map storeId -> aggregate
        const aggMap: Record<number, { avg: number | null; count: number }> = {};
        for (const a of agg) {
          aggMap[a.storeId] = { avg: a._avg?.rating ?? null, count: a._count?.rating ?? 0 };
        }

        const storeRatings = stores.map((s) => ({
          storeId: s.id,
          storeName: s.name,
          email: s.email,
          address: s.address,
          avgRating: aggMap[s.id]?.avg ?? null,
          ratingCount: aggMap[s.id]?.count ?? 0,
        }));

        // compute overall across all owned stores
        let sum = 0;
        let count = 0;
        for (const sr of storeRatings) {
          if (sr.avgRating != null && sr.ratingCount != null) {
            sum += (sr.avgRating * sr.ratingCount);
            count += sr.ratingCount;
          }
        }
        const overallAverageRating = count > 0 ? sum / count : null;

        payload.stores = stores;
        payload.storeRatings = storeRatings;
        payload.overallAverageRating = overallAverageRating;
        payload.overallRatingCount = count;
      }
    }

    return res.json(payload);
  } catch (err: any) {
    console.error('GET /admin/users/:id error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});


export default router;
