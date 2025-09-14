// backend/src/middleware/optionalAuth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface OptionalAuthPayload {
  userId?: number;
  role?: string;
  iat?: number;
  exp?: number;
}

export function optionalAuthenticate(req: Request & { user?: OptionalAuthPayload }, _res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization as string | undefined;
    if (!auth) return next();
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return next();

    const token = parts[1];
    const secret = process.env.ACCESS_TOKEN_SECRET as string;
    if (!secret) return next();

    const payload = jwt.verify(token, secret) as OptionalAuthPayload;
    req.user = payload;
    return next();
  } catch (err) {
    return next();
  }
}
