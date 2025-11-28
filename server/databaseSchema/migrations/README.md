# Database Migrations

## Overview
This directory contains database migration scripts to fix schema mismatches and add missing functionality.

## Migration Files

### 001_fix_customer_order_schema_v3_to_v2_compatibility.sql
**Priority**: CRITICAL
**Status**: Ready to apply
**Purpose**: Fixes the schema mismatch between V2 (code expectations) and V3 (current schema)

**What it does:**
- Adds 15 missing columns to `customer_order` table
- Renames columns to match code expectations
- Creates indexes for performance
- Sets up triggers for automatic data consistency
- Updates existing records with default values

**Columns Added:**
1. `verification_code` - 6-digit order pickup code
2. `order_datetime` - Order timestamp
3. `final_amount` - Grand total after all calculations
4. `kiosk_session_id` - Session tracking
5. `is_preorder` - Pre-order flag
6. `gcash_reference_number` - GCash payment reference
7. `paymaya_reference_number` - PayMaya payment reference
8. `card_transaction_ref` - Card payment reference
9. `payment_verified_at` - Payment verification timestamp
10. `payment_verified_by` - Cashier who verified payment
11. `order_source` - Order origin (kiosk/cashier/admin)
12. `advance_payment_required` - Advance payment flag
13. `advance_payment_amount` - Advance payment amount
14. `is_printed` - Receipt printing status
15. `is_deleted` - Soft delete flag

**Columns Renamed:**
- `scheduled_pickup_time` → `scheduled_pickup_datetime`
- `actual_pickup_time` → `actual_pickup_datetime`

## How to Apply Migrations

### For Render Deployment (Production)

1. **Connect to your Aiven MySQL database:**
   ```bash
   mysql -h <your-aiven-host> -P 27245 -u <username> -p --ssl-mode=REQUIRED
   ```

2. **Run the migration:**
   ```bash
   mysql -h <your-aiven-host> -P 27245 -u <username> -p --ssl-mode=REQUIRED < migrations/001_fix_customer_order_schema_v3_to_v2_compatibility.sql
   ```

3. **Verify the migration:**
   ```sql
   USE GoldenMunchPOS;
   DESCRIBE customer_order;
   SELECT COUNT(*) FROM customer_order;
   ```

### For Local Development

1. **Connect to your local MySQL:**
   ```bash
   mysql -u root -p
   ```

2. **Run the migration:**
   ```bash
   mysql -u root -p < server/databaseSchema/migrations/001_fix_customer_order_schema_v3_to_v2_compatibility.sql
   ```

3. **Verify:**
   ```sql
   USE GoldenMunchPOS;
   SHOW TABLES;
   DESCRIBE customer_order;
   ```

## Migration Order

Always run migrations in numerical order:
1. `001_fix_customer_order_schema_v3_to_v2_compatibility.sql`
2. `../add_kiosk_setting_table.sql` (if not already applied)

## Rollback

⚠️ **WARNING**: There is no automatic rollback for this migration.

If you need to rollback:
1. Backup your database first!
2. Manually remove the added columns:

```sql
ALTER TABLE customer_order
  DROP COLUMN verification_code,
  DROP COLUMN order_datetime,
  DROP COLUMN order_source,
  DROP COLUMN is_preorder,
  DROP COLUMN advance_payment_required,
  DROP COLUMN advance_payment_amount,
  DROP COLUMN final_amount,
  DROP COLUMN gcash_reference_number,
  DROP COLUMN paymaya_reference_number,
  DROP COLUMN card_transaction_ref,
  DROP COLUMN payment_verified_at,
  DROP COLUMN payment_verified_by,
  DROP COLUMN kiosk_session_id,
  DROP COLUMN is_printed,
  DROP COLUMN is_deleted;
```

## Testing After Migration

1. **Test Order Creation:**
   - Create a new order from Kiosk
   - Verify `verification_code` is generated
   - Check that `final_amount` equals `total_amount`

2. **Test Payment Verification:**
   - Try to verify a GCash payment
   - Confirm `gcash_reference_number` is saved
   - Check `payment_verified_at` and `payment_verified_by` are set

3. **Test Custom Cake Orders:**
   - Create a custom cake order
   - Verify customer record is created/linked properly
   - Check order appears in transactions

4. **Test Queries:**
   ```sql
   -- Check recent orders
   SELECT order_id, order_number, verification_code, order_datetime, final_amount
   FROM customer_order
   ORDER BY order_datetime DESC
   LIMIT 10;

   -- Check verification codes are unique per day
   SELECT DATE(order_datetime) as date, COUNT(DISTINCT verification_code) as unique_codes
   FROM customer_order
   GROUP BY DATE(order_datetime);
   ```

## Impact Assessment

**Before Migration:**
- ❌ Order creation fails with "Unknown column 'final_amount'"
- ❌ Payment verification fails
- ❌ Order lookup by verification code fails
- ❌ Custom cake payment fails
- ❌ Transaction history displays incorrectly

**After Migration:**
- ✅ All order operations work correctly
- ✅ Payment verification workflow functional
- ✅ Verification codes generated automatically
- ✅ Custom cake orders process successfully
- ✅ Full compatibility with existing codebase

## Notes

- The migration is **idempotent** - safe to run multiple times
- Uses `IF NOT EXISTS` / `IF EXISTS` clauses for safety
- Existing data is preserved and updated with sensible defaults
- Triggers ensure data consistency going forward
- All changes are backwards compatible

## Support

If you encounter issues during migration:
1. Check the MySQL error log
2. Verify you have ALTER TABLE permissions
3. Ensure the database name is `GoldenMunchPOS`
4. Check that foreign key references exist (cashier table must exist)

## Version History

- **v1.0** (2025-11-28): Initial migration to fix V2/V3 schema mismatch
