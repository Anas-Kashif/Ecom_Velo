import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cache, CACHE_KEYS, CACHE_TTL } from '../utils/cache';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { logger } from '../utils/logger';
import { getJwtSecret } from '../utils/jwt';
import { deleteImageFromCloudinary, generateUploadSignature, extractPublicIdFromUrl } from '../services/cloudinaryService';

const router = express.Router();
const prisma = new PrismaClient();

interface CreateProductRequest {
  name: string;
  slug: string;
  description: string;
  price: number | string;
  cost: number | string;
  stock: number | string;
  categoryId: string;
  sku: string;
  image?: string;
  status?: string;
}

const ALLOWED_PRODUCT_STATUSES = new Set(['draft', 'active', 'inactive']);

function ensureString(value: unknown, fieldName: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} is required`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} is too long`);
  }

  return trimmed;
}

function parseNonNegativeNumber(value: unknown, fieldName: string, defaultValue = 0): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`);
  }

  return parsed;
}

function normalizeProductStatus(status: unknown): string {
  if (status === undefined || status === null || status === '') {
    return 'draft';
  }

  if (typeof status !== 'string') {
    throw new Error('Invalid product status');
  }

  const normalized = status.trim().toLowerCase();
  if (!ALLOWED_PRODUCT_STATUSES.has(normalized)) {
    throw new Error('Invalid product status');
  }

  return normalized;
}

function hasPrivilegedProductAccess(req: Request): boolean {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  try {
    const decoded = jwt.verify(authHeader.substring(7), getJwtSecret()) as any;
    return ['ADMIN', 'MANAGER'].includes(String(decoded.role).toUpperCase());
  } catch {
    return false;
  }
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      skip = '0', 
      take = '20', 
      categoryId, 
      search,
      status,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      noCache = 'false'
    } = req.query;

    // Set cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const isAdmin = hasPrivilegedProductAccess(req);

    // Determine effective status:
    // - Admins see all products (no status filter unless explicitly requested)
    // - Customers see only active products (unless searching for a specific status)
    let effectiveStatus: string | null = null;
    
    if (isAdmin && !status) {
      // Admin with no explicit status filter - show all products
      effectiveStatus = null;
    } else if (status) {
      // Explicit status filter provided
      effectiveStatus = status as string;
    } else {
      // Customer - show only active by default
      effectiveStatus = 'active';
    }

    // Generate cache key based on query parameters
    const cacheKey = `${CACHE_KEYS.PRODUCTS_LIST}:${JSON.stringify({
      skip,
      take,
      categoryId,
      search,
      status: effectiveStatus,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      isAdmin,
    })}`;

    // Try to get from cache (skip if noCache is true)
    if (noCache !== 'true') {
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        return res.json({ ...cachedResult, cached: true });
      }
    }

    const pageSize = Math.min(parseInt(take as string), 100); // Max 100 items per page
    const pageSkip = Math.max(0, parseInt(skip as string));

    // Build where clause for filtering
    const where: any = {};
    
    // Apply status filter only if needed
    if (effectiveStatus) {
      where.status = effectiveStatus as string;
    }
    // If effectiveStatus is null, no status filter is applied (admin sees all)
    
    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    // Validate sortBy to prevent injection
    const validSortFields = ['createdAt', 'name', 'price', 'stock'];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const sortDir = (sortOrder as string).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip: pageSkip,
        take: pageSize,
        orderBy: { [sortField as keyof typeof prisma.product]: sortDir } as any,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    const currentPage = Math.floor(pageSkip / pageSize) + 1;

    const result = {
      products,
      pagination: {
        total,
        totalPages,
        currentPage,
        pageSize,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
      cached: false,
    };

    // Cache the result
    cache.set(cacheKey, result, { ttl: CACHE_TTL.MEDIUM });

    res.json(result);
  } catch (error) {
    logger.error('Product fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Set cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const cacheKey = CACHE_KEYS.PRODUCT_DETAIL(productId);
    
    // Try to get from cache
    const cachedProduct = cache.get(cacheKey);
    if (cachedProduct) {
      return res.json({ ...cachedProduct, cached: true });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        reviews: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Hide inactive and draft products from customers
    if (product.status !== 'active') {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Cache the product
    cache.set(cacheKey, product, { ttl: CACHE_TTL.LONG });

    res.json({ ...product, cached: false });
  } catch (error) {
    logger.error('Product detail fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request<{}, {}, CreateProductRequest>, res: Response) => {
  try {
    const name = ensureString(req.body.name, 'name', 120);
    const slug = ensureString(req.body.slug, 'slug', 150);
    const description = typeof req.body.description === 'string' ? req.body.description.trim().slice(0, 2000) : '';
    if (req.body.price === undefined || req.body.price === null || req.body.price === '') {
      return res.status(400).json({ error: 'price is required' });
    }
    const price = parseNonNegativeNumber(req.body.price, 'price');
    const cost = parseNonNegativeNumber(req.body.cost, 'cost');
    const stock = parseNonNegativeNumber(req.body.stock, 'stock');
    const categoryId = ensureString(req.body.categoryId, 'categoryId', 100);
    const sku = ensureString(req.body.sku, 'sku', 80);
    const image = typeof req.body.image === 'string' ? req.body.image.trim().slice(0, 2048) : '';
    const status = normalizeProductStatus(req.body.status);

    // Check if slug already exists, if so make it unique
    let uniqueSlug = slug;
    const existingProduct = await prisma.product.findUnique({
      where: { slug: uniqueSlug },
    });

    if (existingProduct) {
      // Generate unique slug by appending timestamp
      uniqueSlug = `${slug}-${Date.now()}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: uniqueSlug,
        description,
        price,
        cost,
        stock,
        categoryId,
        sku,
        image,
        status,
      },
      include: { category: true },
    });

    // Invalidate products list cache
    cache.deletePattern(`${CACHE_KEYS.PRODUCTS_LIST}:.*`);

    res.status(201).json(product);
  } catch (error) {
    logger.error('Error creating product', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
    if (errorMessage === 'Invalid product status' || errorMessage.endsWith('is required') || errorMessage.includes('must be a valid non-negative number') || errorMessage.includes('too long')) {
      return res.status(400).json({ error: errorMessage });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updates: Record<string, unknown> = {};

    if (req.body.name !== undefined) updates.name = ensureString(req.body.name, 'name', 120);
    if (req.body.slug !== undefined) updates.slug = ensureString(req.body.slug, 'slug', 150);
    if (req.body.description !== undefined) updates.description = typeof req.body.description === 'string' ? req.body.description.trim().slice(0, 2000) : '';
    if (req.body.price !== undefined) updates.price = parseNonNegativeNumber(req.body.price, 'price');
    if (req.body.cost !== undefined) updates.cost = parseNonNegativeNumber(req.body.cost, 'cost');
    if (req.body.stock !== undefined) updates.stock = parseNonNegativeNumber(req.body.stock, 'stock');
    if (req.body.categoryId !== undefined) updates.categoryId = ensureString(req.body.categoryId, 'categoryId', 100);
    if (req.body.sku !== undefined) updates.sku = ensureString(req.body.sku, 'sku', 80);
    if (req.body.image !== undefined) updates.image = typeof req.body.image === 'string' ? req.body.image.trim().slice(0, 2048) : '';
    if (req.body.status !== undefined) updates.status = normalizeProductStatus(req.body.status);

    const product = await prisma.product.update({
      where: { id: productId },
      data: updates,
      include: { category: true },
    });

    // Invalidate caches for this product and products list
    cache.delete(CACHE_KEYS.PRODUCT_DETAIL(productId));
    cache.deletePattern(`${CACHE_KEYS.PRODUCTS_LIST}:.*`);

    res.json(product);
  } catch (error) {
    logger.error('Error updating product', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
    if (errorMessage === 'Invalid product status' || errorMessage.endsWith('is required') || errorMessage.includes('must be a valid non-negative number') || errorMessage.includes('too long')) {
      return res.status(400).json({ error: errorMessage });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Get product to retrieve image URL for deletion
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    // Delete image from Cloudinary if it exists
    if (product?.image) {
      const publicId = extractPublicIdFromUrl(product.image);
      if (publicId) {
        await deleteImageFromCloudinary(publicId);
      }
    }

    // Delete all related order items first (due to foreign key constraints)
    await prisma.orderItem.deleteMany({
      where: { productId: productId },
    });

    // Delete all related reviews (due to foreign key constraints)
    await prisma.review.deleteMany({
      where: { productId: productId },
    });

    // Then delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    // Invalidate caches for this product and products list
    cache.delete(CACHE_KEYS.PRODUCT_DETAIL(productId));
    cache.deletePattern(`${CACHE_KEYS.PRODUCTS_LIST}:.*`);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Error deleting product', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get Cloudinary upload signature for client-side uploads
router.get('/signature/upload', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const signatureData = generateUploadSignature();
    res.json(signatureData);
  } catch (error) {
    logger.error('Error generating upload signature', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});

// Clear product cache (without restarting server)
router.post('/cache/clear', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const deletedCount = cache.deletePattern(`${CACHE_KEYS.PRODUCTS_LIST}:.*`);
    cache.deletePattern(`${CACHE_KEYS.PRODUCT_DETAIL}:.*`);
    res.json({ 
      success: true,
      message: 'Cache cleared successfully',
      deletedProductsListEntries: deletedCount
    });
  } catch (error) {
    logger.error('Error clearing product cache', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;
