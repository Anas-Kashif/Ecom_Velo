import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import userRoutes from '../../routes/users';
import authRoutes from '../../routes/auth';

describe('User Routes', () => {
  let app: Express;
  let prisma: PrismaClient;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    
    prisma = new PrismaClient();

    // Create test user
    const userEmail = `test-user-${Date.now()}@example.com`;
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: userEmail,
        password: 'TestPassword123!',
        name: 'Test User',
      });

    token = signupResponse.body.token;
    userId = signupResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup: delete test user
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('GET /api/users', () => {
    it('should return list of users with authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should return users with expected properties', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      if (response.body.users.length > 0) {
        const user = response.body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).not.toHaveProperty('password');
      }
    });

    it('should respect pagination', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .query({ skip: 0, take: 5 });

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeLessThanOrEqual(5);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user details by id with authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent-id-12345')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user with valid data', async () => {
      const updateData = {
        name: 'Updated User Name',
        phone: '+1234567890',
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.phone).toBe(updateData.phone);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail when updating non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/nonexistent-id-12345')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/users/:id', () => {
    let deleteTestUserId: string;

    beforeAll(async () => {
      // Create a user to delete
      const deleteUserEmail = `test-delete-${Date.now()}@example.com`;
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: deleteUserEmail,
          password: 'TestPassword123!',
          name: 'Delete Test User',
        });

      deleteTestUserId = signupResponse.body.user.id;
    });

    it('should delete user with authentication', async () => {
      const response = await request(app)
        .delete(`/api/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect([200, 204]).toContain(response.status);

      // Verify user is deleted
      const checkResponse = await request(app)
        .get(`/api/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(checkResponse.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
