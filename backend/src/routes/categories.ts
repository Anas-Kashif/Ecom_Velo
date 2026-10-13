import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    logger.error('Category fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id as string },
      include: { products: true },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    logger.error('Category detail fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

router.post('/', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const slug = typeof req.body.slug === 'string' ? req.body.slug.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim().slice(0, 2000) : '';
    const image = typeof req.body.image === 'string' ? req.body.image.trim().slice(0, 2048) : '';

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    if (name.length > 120 || slug.length > 150) {
      return res.status(400).json({ error: 'Category fields are too long' });
    }

    const category = await prisma.category.create({
      data: { name, slug, description, image },
    });

    res.status(201).json(category);
  } catch (error) {
    logger.error('Category creation failed', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: Record<string, unknown> = {};

    if (typeof req.body.name === 'string') updates.name = req.body.name.trim();
    if (typeof req.body.slug === 'string') updates.slug = req.body.slug.trim();
    if (typeof req.body.description === 'string') updates.description = req.body.description.trim().slice(0, 2000);
    if (typeof req.body.image === 'string') updates.image = req.body.image.trim().slice(0, 2048);

    if (updates.name && String(updates.name).length > 120) {
      return res.status(400).json({ error: 'Category name is too long' });
    }

    if (updates.slug && String(updates.slug).length > 150) {
      return res.status(400).json({ error: 'Category slug is too long' });
    }

    const category = await prisma.category.update({
      where: { id: id as string },
      data: updates,
    });

    res.json(category);
  } catch (error) {
    logger.error('Category update failed', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id: id as string },
    });

    res.json({ message: 'Category deleted' });
  } catch (error) {
    logger.error('Category deletion failed', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
