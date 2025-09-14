// backend/src/routes/auth.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();
const router = express.Router();

router.post('/register',
  body('name').isString().isLength({ min: 3 }), // adjust rules if you want
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { name, email, password } = req.body;
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({ data: { name, email, password: hashed } });
      return res.json({ message: 'User registered', user });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
);

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '15m' }
    );

    return res.json({ accessToken: token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
