import { buildSafeUpdateQuery, validateDateRange } from '../../src/utils/helpers';

describe('Helper Functions', () => {
  describe('buildSafeUpdateQuery', () => {
    it('should build safe UPDATE query with whitelisted columns', () => {
      const allowedColumns = ['name', 'description', 'price'];
      const updates = {
        name: 'New Name',
        description: 'New Description',
        price: 100,
      };

      const result = buildSafeUpdateQuery('menu_item', updates, allowedColumns);

      expect(result.query).toContain('UPDATE menu_item SET');
      expect(result.query).toContain('name = ?');
      expect(result.query).toContain('description = ?');
      expect(result.query).toContain('price = ?');
      expect(result.values).toEqual(['New Name', 'New Description', 100]);
    });

    it('should filter out non-whitelisted columns', () => {
      const allowedColumns = ['name', 'price'];
      const updates = {
        name: 'New Name',
        price: 100,
        malicious_column: 'DROP TABLE',
      };

      const result = buildSafeUpdateQuery('menu_item', updates, allowedColumns);

      expect(result.query).not.toContain('malicious_column');
      expect(result.values).toEqual(['New Name', 100]);
    });

    it('should throw error when no valid columns provided', () => {
      const allowedColumns = ['name', 'price'];
      const updates = {
        invalid_field: 'value',
      };

      expect(() => {
        buildSafeUpdateQuery('menu_item', updates, allowedColumns);
      }).toThrow();
    });

    it('should handle empty updates object', () => {
      const allowedColumns = ['name', 'price'];
      const updates = {};

      expect(() => {
        buildSafeUpdateQuery('menu_item', updates, allowedColumns);
      }).toThrow();
    });
  });

  describe('validateDateRange', () => {
    it('should accept valid date range', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      expect(() => {
        validateDateRange(startDate, endDate);
      }).not.toThrow();
    });

    it('should throw error when start date is after end date', () => {
      const startDate = '2024-02-01';
      const endDate = '2024-01-01';

      expect(() => {
        validateDateRange(startDate, endDate);
      }).toThrow('start_date must be before or equal to end_date');
    });

    it('should throw error when date range exceeds maximum', () => {
      const startDate = '2024-01-01';
      const endDate = '2025-02-01'; // More than 365 days

      expect(() => {
        validateDateRange(startDate, endDate);
      }).toThrow('Date range cannot exceed 365 days');
    });

    it('should accept date range exactly at maximum limit', () => {
      const startDate = '2024-01-01';
      const endDate = '2025-01-01'; // Exactly 365 days

      expect(() => {
        validateDateRange(startDate, endDate);
      }).not.toThrow();
    });

    it('should throw error for invalid date format', () => {
      const startDate = 'invalid-date';
      const endDate = '2024-01-31';

      expect(() => {
        validateDateRange(startDate, endDate);
      }).toThrow();
    });

    it('should allow same start and end date', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-01';

      expect(() => {
        validateDateRange(startDate, endDate);
      }).not.toThrow();
    });
  });
});
