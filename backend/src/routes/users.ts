// backend/src/routes/users.ts
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth'; 

const prisma = new PrismaClient();
const router = express.Router();

const passwordValidators = [
  body('currentPassword').isString().notEmpty().withMessage('Current password required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8, max: 16 }).withMessage('Password must be 8-16 chars')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/\W/).withMessage('Must contain a special character'),
];

router.patch(
  '/me/password',
  authenticate,
  passwordValidators,
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const { currentPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(403).json({ error: 'Current password is incorrect' });

     
      if (await bcrypt.compare(newPassword, user.password)) {
        return res.status(400).json({ error: 'New password must be different from current password' });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed, refreshToken: null } });

      return res.json({ message: 'Password updated successfully' });
    } catch (err: any) {
      console.error('Change password error', err);
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  }
);

export default router;
