import request from 'supertest';
import express from 'express';
import router from '../../src/routes';

describe('Kiosk API Endpoints', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', router);
  });

  describe('GET /api/kiosk/menu', () => {
    it('should return menu items successfully', async () => {
      const response = await request(app)
        .get('/api/kiosk/menu')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter menu items by category', async () => {
      const response = await request(app)
        .get('/api/kiosk/menu?category_id=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return available items only', async () => {
      const response = await request(app)
        .get('/api/kiosk/menu?available_only=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      const items = response.body.data;
      items.forEach((item: any) => {
        expect(item.current_stock).toBeGreaterThan(0);
        expect(item.is_deleted).toBe(false);
      });
    });
  });

  describe('GET /api/kiosk/categories', () => {
    it('should return categories successfully', async () => {
      const response = await request(app)
        .get('/api/kiosk/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return categories with item counts', async () => {
      const response = await request(app)
        .get('/api/kiosk/categories?include_counts=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      const categories = response.body.data;
      categories.forEach((category: any) => {
        expect(category).toHaveProperty('item_count');
      });
    });
  });

  describe('GET /api/kiosk/promotions', () => {
    it('should return active promotions', async () => {
      const response = await request(app)
        .get('/api/kiosk/promotions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return only kiosk-visible promotions', async () => {
      const response = await request(app)
        .get('/api/kiosk/promotions')
        .expect(200);

      const promotions = response.body.data;
      promotions.forEach((promo: any) => {
        expect(promo.display_on_kiosk).toBe(true);
        expect(promo.is_active).toBe(true);
      });
    });
  });

  describe('POST /api/kiosk/orders', () => {
    it('should create order with valid data', async () => {
      const orderData = {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '09123456789',
        order_type: 'dine_in',
        payment_method: 'cash',
        items: [
          {
            menu_item_id: 1,
            quantity: 2,
            unit_price: 100,
            special_instructions: 'No sugar',
          },
        ],
      };

      const response = await request(app)
        .post('/api/kiosk/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order_id');
      expect(response.body.data).toHaveProperty('verification_code');
      expect(response.body.data).toHaveProperty('qr_code_data');
    });

    it('should reject order with missing required fields', async () => {
      const invalidOrder = {
        customer_name: 'Test Customer',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/kiosk/orders')
        .send(invalidOrder)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject order with invalid payment method', async () => {
      const orderData = {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '09123456789',
        order_type: 'dine_in',
        payment_method: 'invalid_method', // Invalid
        items: [{ menu_item_id: 1, quantity: 1, unit_price: 100 }],
      };

      const response = await request(app)
        .post('/api/kiosk/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/kiosk/orders/:code', () => {
    it('should retrieve order by verification code', async () => {
      // First create an order
      const orderData = {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '09123456789',
        order_type: 'takeout',
        payment_method: 'gcash',
        items: [{ menu_item_id: 1, quantity: 1, unit_price: 150 }],
      };

      const createResponse = await request(app)
        .post('/api/kiosk/orders')
        .send(orderData);

      const verificationCode = createResponse.body.data.verification_code;

      // Now retrieve it
      const response = await request(app)
        .get(`/api/kiosk/orders/${verificationCode}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order_id');
      expect(response.body.data.customer_name).toBe('Test Customer');
    });

    it('should return 404 for invalid verification code', async () => {
      const response = await request(app)
        .get('/api/kiosk/orders/INVALID123')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
