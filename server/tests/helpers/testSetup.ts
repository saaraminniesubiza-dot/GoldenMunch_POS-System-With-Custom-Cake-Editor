import { Pool } from 'mysql2/promise';

// Test database configuration
export const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME_TEST || 'goldenmunch_pos_test',
  waitForConnections: true,
  connectionLimit: 10,
};

// Mock admin token for testing
export const mockAdminToken = 'mock-admin-token-for-testing';
export const mockCashierToken = 'mock-cashier-token-for-testing';

// Test data factories
export const createTestMenuItem = () => ({
  name: 'Test Cake',
  description: 'Test Description',
  item_type: 'cake',
  unit_of_measure: 'piece',
  current_stock: 100,
  minimum_stock_level: 10,
});

export const createTestCategory = () => ({
  category_name: 'Test Category',
  description: 'Test Category Description',
  display_order: 1,
});

export const createTestOrder = () => ({
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
});

// Database cleanup utilities
export async function cleanupTestData(pool: Pool) {
  const connection = await pool.getConnection();
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clean up test data in reverse order of dependencies
    await connection.query('DELETE FROM order_item WHERE order_id > 0');
    await connection.query('DELETE FROM customer_order WHERE order_id > 0');
    await connection.query('DELETE FROM menu_item_price WHERE menu_item_id > 0');
    await connection.query('DELETE FROM category_has_menu_item WHERE menu_item_id > 0');
    await connection.query('DELETE FROM menu_item WHERE menu_item_id > 0');
    await connection.query('DELETE FROM category WHERE category_id > 0');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    connection.release();
  }
}

// Wait for database connection
export async function waitForDatabase(pool: Pool, maxRetries = 10): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('Failed to connect to test database:', error);
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}
