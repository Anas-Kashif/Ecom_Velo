import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { skip = '0', take = '20', status } = req.query;

    const users = await prisma.user.findMany({
      where: status ? { status: status as string } : {},
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      skip: parseInt(skip as string),
      take: parseInt(take as string),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count();

    res.json({
      users,
      total,
      skip: parseInt(skip as string),
      take: parseInt(take as string),
    });
  } catch (error) {
    logger.error('User list fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', authenticate, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('User detail fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/:id', authenticate, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : undefined;
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : undefined;
    const status = typeof req.body.status === 'string' ? req.body.status.trim().toLowerCase() : undefined;

    if (name !== undefined && !name) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    if (name && name.length > 100) {
      return res.status(400).json({ error: 'Name is too long' });
    }

    if (phone && phone.length > 30) {
      return res.status(400).json({ error: 'Phone is too long' });
    }

    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid user status' });
    }

    const user = await prisma.user.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(status && { status }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
      },
    });

    res.json(user);
  } catch (error) {
    logger.error('User update failed', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', authenticate, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: id as string },
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    logger.error('User deletion failed', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
