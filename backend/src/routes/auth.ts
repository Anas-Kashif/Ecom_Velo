import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createRateLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import { getJwtSecret } from '../utils/jwt';

const router = express.Router();
const prisma = new PrismaClient();
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again later.',
});
const signupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many sign up attempts. Please try again later.',
});

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

// REGISTER / SIGNUP
router.post('/signup', signupLimiter, async (req: Request<{}, {}, SignupRequest>, res: Response) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (email.length > 255 || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Name is too long' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: 'USER',
      },
      getJwtSecret(),
      {
        expiresIn: '7d',
      },
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    logger.error('Signup failed', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// LOGIN
router.post('/login', loginLimiter, async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (email.length > 255 || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: 'USER',
      },
      getJwtSecret(),
      {
        expiresIn: '7d',
      },
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    logger.error('Login failed', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET CURRENT USER
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
