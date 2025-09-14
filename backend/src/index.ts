import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import storeRouter from './routes/stores';
import { PrismaClient } from '@prisma/client';
import usersRouter from './routes/users';
import ratingsRouter from './routes/ratings';





dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

const debugPrisma = new PrismaClient();

app.get('/debug-prisma', async (req, res) => {
  try {     
    const keys = Object.keys(debugPrisma).filter(k => typeof (debugPrisma as any)[k] !== 'function' || true);
    const hasUser = !!(debugPrisma as any).user;
    res.json({ ok: true, hasUser, keys: keys.slice(0,50) });
  } catch (err:any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


app.get('/', (req, res) => {
  res.send('API is working 🚀');
});



app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/stores', storeRouter);
app.use('/users', usersRouter);
app.use('/', ratingsRouter); 


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
