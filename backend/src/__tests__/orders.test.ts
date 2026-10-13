import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import orderRoutes from '../routes/orders';
import authRoutes from '../routes/auth';

describe('Order Routes', () => {
  let app: Express;
  let prisma: PrismaClient;
  let token: string;
  let userId: string;
  let productId: string;
  let initialStock: number;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/orders', orderRoutes);

    prisma = new PrismaClient();

    const userEmail = `test-order-${Date.now()}@example.com`;
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: userEmail,
        password: 'TestPassword123!',
        name: 'Order Test User',
      });

    token = signupResponse.body.token;
    userId = signupResponse.body.user.id;

    const selectedProduct = await prisma.product.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!selectedProduct) {
      throw new Error('No product records were found for order tests');
    }

    productId = selectedProduct.id;
    initialStock = selectedProduct.stock;
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { orderId: { not: '' } } });
    await prisma.order.deleteMany({ where: { userId } });

    if (productId) {
      await prisma.product.update({
        where: { id: productId },
        data: { stock: initialStock },
      });
    }

    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('POST /api/orders', () => {
    it('should create order with valid data', async () => {
      const orderData = {
        userId,
        items: [
          {
            productId,
            quantity: 2,
          },
        ],
        shippingCity: 'New York',
        shippingState: 'NY',
        shippingZipCode: '10001',
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('totalAmount');
      expect(response.body.totalAmount).toBeGreaterThan(0);
    });

    it('should decrement product stock after order creation', async () => {
      const stockBefore = (await prisma.product.findUnique({ where: { id: productId } }))?.stock ?? 0;

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          items: [{ productId, quantity: 3 }],
          shippingCity: 'Boston',
          shippingState: 'MA',
          shippingZipCode: '02108',
        });

      expect(response.status).toBe(201);

      const createdOrderId = response.body.id;
      const updatedProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      expect(updatedProduct?.stock).toBe(stockBefore - 3);

      await prisma.order.delete({ where: { id: createdOrderId } });
      await prisma.product.update({
        where: { id: productId },
        data: { stock: stockBefore },
      });
    });

    it('should fail without authentication token', async () => {
      const orderData = {
        userId,
        items: [{ productId, quantity: 1 }],
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with empty items array', async () => {
      const orderData = {
        userId,
        items: [],
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/orders', () => {
    it('should return user orders with authentication', async () => {
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          items: [{ productId, quantity: 1 }],
        });

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should fail without authentication token', async () => {
      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should respect pagination', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .query({ skip: 0, take: 5 });

      expect(response.status).toBe(200);
      expect(response.body.orders.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/orders/:id', () => {
    let orderId: string;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          items: [{ productId, quantity: 1 }],
        });

      orderId = createResponse.body.id;
    });

    it('should return order details by id', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', orderId);
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body).toHaveProperty('totalAmount');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/nonexistent-id-12345')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
