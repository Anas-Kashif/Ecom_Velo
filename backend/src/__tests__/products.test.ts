import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import productRoutes from '../routes/products';
import categoryRoutes from '../routes/categories';

describe('Product Routes', () => {
  let app: Express;
  let prisma: PrismaClient;
  let categoryId: string;
  let detailProductId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);

    prisma = new PrismaClient();

    const product = await prisma.product.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!product) {
      throw new Error('No products were found for product detail tests');
    }

    detailProductId = product.id;
    categoryId = product.categoryId;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/products', () => {
    it('should return list of products with pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ skip: 0, take: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBeGreaterThan(0);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ categoryId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.products[0].categoryId).toBe(categoryId);
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ skip: 0, take: 5 });

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product details by id', async () => {
      const response = await request(app)
        .get(`/api/products/${detailProductId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', detailProductId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('stock');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/nonexistent-id-12345');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return categories with expected properties', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        const category = response.body[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
      }
    });
  });
});
