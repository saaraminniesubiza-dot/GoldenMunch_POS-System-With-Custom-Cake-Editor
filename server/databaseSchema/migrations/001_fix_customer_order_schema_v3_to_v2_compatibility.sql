-- ============================================================================
-- MIGRATION: Fix customer_order Schema - V3 to V2 Compatibility
-- Issue: Code expects V2 schema columns, but V3 schema is missing them
-- Date: 2025-11-28
-- Priority: CRITICAL - Fixes order creation, payment verification, and more
-- ============================================================================

-- This migration adds all missing columns from V2 schema to V3 schema
-- to make the database compatible with the existing codebase

USE GoldenMunchPOS;

-- ============================================================================
-- STEP 1: Add Missing Critical Columns
-- ============================================================================

ALTER TABLE customer_order

  -- Critical order identification
  ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6) NOT NULL DEFAULT '000000' COMMENT 'Random 6-digit code for order pickup' AFTER order_number,
  ADD COLUMN IF NOT EXISTS order_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER customer_id,

  -- Order classification
  ADD COLUMN IF NOT EXISTS order_source ENUM('kiosk', 'cashier', 'admin') NOT NULL DEFAULT 'kiosk' AFTER order_type,
  ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT FALSE AFTER order_source,

  -- Payment amounts (final_amount is the grand total after all calculations)
  ADD COLUMN IF NOT EXISTS advance_payment_required BOOLEAN DEFAULT FALSE AFTER is_preorder,
  ADD COLUMN IF NOT EXISTS advance_payment_amount DECIMAL(10,2) DEFAULT 0.00 AFTER advance_payment_required,
  ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Grand total = total_amount (same value for compatibility)' AFTER total_amount,

  -- Payment references for e-wallets and cards
  ADD COLUMN IF NOT EXISTS gcash_reference_number VARCHAR(100) NULL COMMENT 'GCash transaction reference' AFTER payment_method,
  ADD COLUMN IF NOT EXISTS paymaya_reference_number VARCHAR(100) NULL COMMENT 'PayMaya transaction reference' AFTER gcash_reference_number,
  ADD COLUMN IF NOT EXISTS card_transaction_ref VARCHAR(100) NULL COMMENT 'Card payment reference' AFTER paymaya_reference_number,

  -- Payment verification workflow
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP NULL AFTER payment_status,
  ADD COLUMN IF NOT EXISTS payment_verified_by INT NULL COMMENT 'Cashier who verified payment' AFTER payment_verified_at,

  -- Session and printing
  ADD COLUMN IF NOT EXISTS kiosk_session_id VARCHAR(100) NULL COMMENT 'Kiosk session identifier' AFTER kiosk_id,
  ADD COLUMN IF NOT EXISTS is_printed BOOLEAN DEFAULT FALSE COMMENT 'Has receipt been printed' AFTER completed_at,

  -- Soft delete (for order history without permanent deletion)
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE AFTER is_printed;

-- ============================================================================
-- STEP 2: Rename Columns to Match Code Expectations
-- ============================================================================

-- The code expects *_datetime suffix, not *_time
ALTER TABLE customer_order
  CHANGE COLUMN IF EXISTS scheduled_pickup_time scheduled_pickup_datetime TIMESTAMP NULL,
  CHANGE COLUMN IF EXISTS actual_pickup_time actual_pickup_datetime TIMESTAMP NULL;

-- ============================================================================
-- STEP 3: Add Indexes for Performance
-- ============================================================================

ALTER TABLE customer_order
  ADD INDEX IF NOT EXISTS idx_verification_code (verification_code),
  ADD INDEX IF NOT EXISTS idx_order_datetime (order_datetime),
  ADD INDEX IF NOT EXISTS idx_gcash_ref (gcash_reference_number),
  ADD INDEX IF NOT EXISTS idx_paymaya_ref (paymaya_reference_number),
  ADD INDEX IF NOT EXISTS idx_order_source (order_source),
  ADD INDEX IF NOT EXISTS idx_preorder (is_preorder),
  ADD INDEX IF NOT EXISTS idx_kiosk_session (kiosk_session_id),
  ADD INDEX IF NOT EXISTS idx_is_deleted (is_deleted);

-- ============================================================================
-- STEP 4: Add Foreign Keys
-- ============================================================================

-- Add foreign key for payment_verified_by (cashier who verified the payment)
ALTER TABLE customer_order
  ADD CONSTRAINT IF NOT EXISTS fk_payment_verified_by
  FOREIGN KEY (payment_verified_by) REFERENCES cashier(cashier_id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 5: Add Unique Constraints
-- ============================================================================

-- Ensure verification codes are unique within the same day
-- (codes can repeat on different days, which is acceptable)
ALTER TABLE customer_order
  ADD UNIQUE KEY IF NOT EXISTS unique_verification_code (verification_code, DATE(order_datetime));

-- ============================================================================
-- STEP 6: Update Existing Records
-- ============================================================================

-- Sync final_amount with total_amount for existing records
UPDATE customer_order
SET final_amount = total_amount
WHERE final_amount = 0.00 OR final_amount IS NULL;

-- Generate verification codes for existing orders that don't have them
UPDATE customer_order
SET verification_code = LPAD(FLOOR(100000 + RAND() * 900000), 6, '0')
WHERE verification_code = '000000' OR verification_code IS NULL;

-- Set order_datetime from created_at for existing records
UPDATE customer_order
SET order_datetime = created_at
WHERE order_datetime IS NULL;

-- ============================================================================
-- STEP 7: Add Triggers to Maintain Data Consistency
-- ============================================================================

DELIMITER //

-- Trigger: Auto-sync final_amount with total_amount
DROP TRIGGER IF EXISTS trg_sync_final_amount_insert//
CREATE TRIGGER trg_sync_final_amount_insert
BEFORE INSERT ON customer_order
FOR EACH ROW
BEGIN
    -- If final_amount is not set, copy from total_amount
    IF NEW.final_amount = 0.00 OR NEW.final_amount IS NULL THEN
        SET NEW.final_amount = NEW.total_amount;
    END IF;
END//

DROP TRIGGER IF EXISTS trg_sync_final_amount_update//
CREATE TRIGGER trg_sync_final_amount_update
BEFORE UPDATE ON customer_order
FOR EACH ROW
BEGIN
    -- If total_amount changes but final_amount doesn't, sync them
    IF NEW.total_amount != OLD.total_amount AND NEW.final_amount = OLD.final_amount THEN
        SET NEW.final_amount = NEW.total_amount;
    END IF;
END//

-- Trigger: Auto-generate verification code if not provided
DROP TRIGGER IF EXISTS trg_generate_verification_code//
CREATE TRIGGER trg_generate_verification_code
BEFORE INSERT ON customer_order
FOR EACH ROW
BEGIN
    -- Generate random 6-digit code if not provided
    IF NEW.verification_code = '000000' OR NEW.verification_code IS NULL THEN
        SET NEW.verification_code = LPAD(FLOOR(100000 + RAND() * 900000), 6, '0');
    END IF;
END//

-- Trigger: Auto-set order_datetime if not provided
DROP TRIGGER IF EXISTS trg_set_order_datetime//
CREATE TRIGGER trg_set_order_datetime
BEFORE INSERT ON customer_order
FOR EACH ROW
BEGIN
    -- Set order_datetime to current timestamp if not provided
    IF NEW.order_datetime IS NULL THEN
        SET NEW.order_datetime = CURRENT_TIMESTAMP;
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- STEP 8: Verification and Summary
-- ============================================================================

-- Show the updated table structure
SHOW CREATE TABLE customer_order;

-- Count existing orders
SELECT COUNT(*) as total_orders FROM customer_order;

-- Show sample of updated data
SELECT
    order_id,
    order_number,
    verification_code,
    order_datetime,
    order_source,
    total_amount,
    final_amount,
    payment_status,
    order_status
FROM customer_order
ORDER BY order_id DESC
LIMIT 5;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '╔════════════════════════════════════════════════════════════════════╗' as '';
SELECT '║                                                                    ║' as '';
SELECT '║     CUSTOMER_ORDER SCHEMA MIGRATION COMPLETED SUCCESSFULLY        ║' as '';
SELECT '║                                                                    ║' as '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' as '';
SELECT '' as '';
SELECT '✅ Added 15 missing columns to customer_order table' as 'STATUS';
SELECT '✅ Renamed columns to match code expectations' as '';
SELECT '✅ Added indexes for performance' as '';
SELECT '✅ Added foreign keys for data integrity' as '';
SELECT '✅ Updated existing records with default values' as '';
SELECT '✅ Created triggers for automatic data sync' as '';
SELECT '' as '';
SELECT '📋 WHAT WAS ADDED:' as '';
SELECT '   • verification_code (6-digit order pickup code)' as '';
SELECT '   • order_datetime (order timestamp)' as '';
SELECT '   • final_amount (grand total)' as '';
SELECT '   • kiosk_session_id (session tracking)' as '';
SELECT '   • is_preorder (pre-order flag)' as '';
SELECT '   • gcash_reference_number (GCash payments)' as '';
SELECT '   • paymaya_reference_number (PayMaya payments)' as '';
SELECT '   • payment_verified_at/by (verification workflow)' as '';
SELECT '   • order_source (kiosk/cashier/admin)' as '';
SELECT '   • Plus 6 more columns...' as '';
SELECT '' as '';
SELECT '⚠️  NEXT STEPS:' as '';
SELECT '   1. Test order creation from Kiosk' as '';
SELECT '   2. Test payment verification from Cashier' as '';
SELECT '   3. Test custom cake ordering' as '';
SELECT '   4. Verify all transactions display correctly' as '';
SELECT '' as '';
SELECT '🚀 Database now compatible with existing codebase!' as '';
