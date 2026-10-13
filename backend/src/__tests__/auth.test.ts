import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../../routes/auth';

describe('Auth Routes', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(() => {
    // Create a test Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid credentials', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          password: 'TestPassword123!',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with existing email', async () => {
      const email = `test-${Date.now()}@example.com`;
      const userData = {
        email,
        password: 'TestPassword123!',
        name: 'Test User',
      };

      // First signup
      await request(app).post('/api/auth/signup').send(userData);

      // Try to signup with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: { email: string; password: string };

    beforeAll(async () => {
      testUser = {
        email: `test-login-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      };

      await request(app).post('/api/auth/signup').send({
        ...testUser,
        name: 'Test User',
      });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(testUser);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: `nonexistent-${Date.now()}@example.com`,
          password: 'AnyPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;
    let userEmail: string;

    beforeAll(async () => {
      userEmail = `test-me-${Date.now()}@example.com`;
      const loginResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: userEmail,
          password: 'TestPassword123!',
          name: 'Test User',
        });

      token = loginResponse.body.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userEmail);
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
