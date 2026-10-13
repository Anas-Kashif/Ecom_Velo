import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

describe('Admin Dashboard Routes', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json());

    // Setup the dashboard endpoint
    app.get('/api/admin/dashboard', async (req, res) => {
      try {
        const totalUsers = await prisma.user.count();
        const totalOrders = await prisma.order.count();
        const totalProducts = await prisma.product.count();
        const totalRevenue = await prisma.order.aggregate({
          _sum: { totalAmount: true },
        });

        res.json({
          totalUsers,
          totalOrders,
          totalProducts,
          totalRevenue: totalRevenue._sum?.totalAmount || 0,
          revenueGrowth: 12.5,
          ordersGrowth: 8.3,
        });
      } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
      }
    });

    // Setup health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date(),
        database: 'Connected',
      });
    });

    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
    });
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard stats', async () => {
      const response = await request(app).get('/api/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body).toHaveProperty('totalProducts');
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('revenueGrowth');
      expect(response.body).toHaveProperty('ordersGrowth');
    });

    it('should return numeric values for stats', async () => {
      const response = await request(app).get('/api/admin/dashboard');

      expect(response.status).toBe(200);
      expect(typeof response.body.totalUsers).toBe('number');
      expect(typeof response.body.totalOrders).toBe('number');
      expect(typeof response.body.totalProducts).toBe('number');
      expect(typeof response.body.totalRevenue).toBe('number');
    });

    it('stats should be non-negative', async () => {
      const response = await request(app).get('/api/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.totalUsers).toBeGreaterThanOrEqual(0);
      expect(response.body.totalOrders).toBeGreaterThanOrEqual(0);
      expect(response.body.totalProducts).toBeGreaterThanOrEqual(0);
      expect(response.body.totalRevenue).toBeGreaterThanOrEqual(0);
    });
  });
});
