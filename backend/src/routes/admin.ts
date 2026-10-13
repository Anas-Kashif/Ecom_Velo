import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimit';
import { requireRoles } from '../middleware/roles';
import { logger } from '../utils/logger';
import { getJwtSecret } from '../utils/jwt';

const router = express.Router();
const prisma = new PrismaClient();
const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many admin login attempts. Please try again later.',
});

interface AdminLoginRequest {
  email: string;
  password: string;
}

// Admin login endpoint - now reads from database
router.post('/login', adminLoginLimiter, async (req: Request<{}, {}, AdminLoginRequest>, res: Response) => {
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

    // Find admin user in database
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check status
    if (admin.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        type: 'admin',
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    res.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      token,
      createdAt: admin.createdAt,
    });
  } catch (error) {
    logger.error('Admin login failed', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get admin profile
router.get('/profile', authenticate, requireRoles('ADMIN', 'MANAGER', 'VIEWER'), async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin profile' });
  }
});

// Verify admin token
router.get('/verify', authenticate, requireRoles('ADMIN', 'MANAGER', 'VIEWER'), async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
      authenticated: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

// Admin stats endpoint (requires admin role)
router.get('/stats', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admin role can access detailed stats
    if (admin.role !== 'ADMIN' && admin.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const stats = {
      totalUsers: await prisma.user.count(),
      totalOrders: await prisma.order.count(),
      totalProducts: await prisma.product.count(),
      totalCategories: await prisma.category.count(),
      todayOrders: await prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      todayRevenue: await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    };

    res.json(stats);
  } catch (error) {
    logger.error('Admin stats fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// List all admin users (admin only)
router.get('/users', authenticate, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view admin users' });
    }

    const adminUsers = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.json(adminUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

// Create new admin user (admin only)
router.post('/users', authenticate, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create admin users' });
    }

    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const role = typeof req.body.role === 'string' ? req.body.role.toUpperCase() : 'VIEWER';

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
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

    if (!['ADMIN', 'MANAGER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid admin role' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newAdmin = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    res.status(201).json(newAdmin);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    logger.error('Admin user creation failed', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

export default router;
