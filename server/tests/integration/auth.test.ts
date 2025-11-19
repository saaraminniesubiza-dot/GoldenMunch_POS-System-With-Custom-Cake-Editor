import request from 'supertest';
import express from 'express';
import router from '../../src/routes';

describe('Authentication API Endpoints', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', router);
  });

  describe('POST /api/auth/admin/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('admin');
      expect(response.body.data.admin).toHaveProperty('admin_id');
      expect(response.body.data.admin).toHaveProperty('username');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/cashier/login', () => {
    it('should login cashier with valid code and PIN', async () => {
      const response = await request(app)
        .post('/api/auth/cashier/login')
        .send({
          cashier_code: 'CASH001',
          pin: '1234',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('cashier');
    });

    it('should reject invalid PIN', async () => {
      const response = await request(app)
        .post('/api/auth/cashier/login')
        .send({
          cashier_code: 'CASH001',
          pin: '0000',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent cashier code', async () => {
      const response = await request(app)
        .post('/api/auth/cashier/login')
        .send({
          cashier_code: 'INVALID',
          pin: '1234',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/verify', () => {
    let validToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/admin/login')
        .send({
          username: 'admin',
          password: 'admin123',
        });

      validToken = loginResponse.body.data.token;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
