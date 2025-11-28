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
-- HELPER PROCEDURE: Add column only if it doesn't exist
-- ============================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS AddColumnIfNotExists//
CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(128),
    IN columnName VARCHAR(128),
    IN columnDefinition TEXT
)
BEGIN
    DECLARE columnExists INT;

    SELECT COUNT(*) INTO columnExists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = tableName
      AND COLUMN_NAME = columnName;

    IF columnExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('✓ Added column: ', columnName) as Status;
    ELSE
        SELECT CONCAT('⊘ Column already exists: ', columnName) as Status;
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- STEP 1: Add Missing Critical Columns
-- ============================================================================

SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 1: Adding missing columns to customer_order' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- Critical order identification
CALL AddColumnIfNotExists('customer_order', 'verification_code', "VARCHAR(6) NOT NULL DEFAULT '000000' COMMENT 'Random 6-digit code for order pickup' AFTER order_number");
CALL AddColumnIfNotExists('customer_order', 'order_datetime', "TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER customer_id");

-- Order classification
CALL AddColumnIfNotExists('customer_order', 'order_source', "ENUM('kiosk', 'cashier', 'admin') NOT NULL DEFAULT 'kiosk' AFTER order_type");
CALL AddColumnIfNotExists('customer_order', 'is_preorder', "BOOLEAN DEFAULT FALSE AFTER order_source");

-- Payment amounts
CALL AddColumnIfNotExists('customer_order', 'advance_payment_required', "BOOLEAN DEFAULT FALSE AFTER is_preorder");
CALL AddColumnIfNotExists('customer_order', 'advance_payment_amount', "DECIMAL(10,2) DEFAULT 0.00 AFTER advance_payment_required");
CALL AddColumnIfNotExists('customer_order', 'final_amount', "DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Grand total = total_amount (same value for compatibility)' AFTER total_amount");

-- Payment references for e-wallets and cards
CALL AddColumnIfNotExists('customer_order', 'gcash_reference_number', "VARCHAR(100) NULL COMMENT 'GCash transaction reference' AFTER payment_method");
CALL AddColumnIfNotExists('customer_order', 'paymaya_reference_number', "VARCHAR(100) NULL COMMENT 'PayMaya transaction reference' AFTER gcash_reference_number");
CALL AddColumnIfNotExists('customer_order', 'card_transaction_ref', "VARCHAR(100) NULL COMMENT 'Card payment reference' AFTER paymaya_reference_number");

-- Payment verification workflow
CALL AddColumnIfNotExists('customer_order', 'payment_verified_at', "TIMESTAMP NULL AFTER payment_status");
CALL AddColumnIfNotExists('customer_order', 'payment_verified_by', "INT NULL COMMENT 'Cashier who verified payment' AFTER payment_verified_at");

-- Session and printing
CALL AddColumnIfNotExists('customer_order', 'kiosk_session_id', "VARCHAR(100) NULL COMMENT 'Kiosk session identifier' AFTER kiosk_id");
CALL AddColumnIfNotExists('customer_order', 'is_printed', "BOOLEAN DEFAULT FALSE COMMENT 'Has receipt been printed' AFTER completed_at");

-- Soft delete
CALL AddColumnIfNotExists('customer_order', 'is_deleted', "BOOLEAN DEFAULT FALSE AFTER is_printed");

-- ============================================================================
-- STEP 2: Rename Columns to Match Code Expectations
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 2: Renaming columns to match code expectations' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- Check and rename scheduled_pickup_time to scheduled_pickup_datetime
SET @columnExists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customer_order'
      AND COLUMN_NAME = 'scheduled_pickup_time'
);

SET @newColumnExists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customer_order'
      AND COLUMN_NAME = 'scheduled_pickup_datetime'
);

-- Only rename if old column exists and new one doesn't
SET @sql = IF(@columnExists > 0 AND @newColumnExists = 0,
    'ALTER TABLE customer_order CHANGE COLUMN scheduled_pickup_time scheduled_pickup_datetime TIMESTAMP NULL',
    'SELECT "⊘ Column scheduled_pickup_datetime already exists or scheduled_pickup_time not found" as Status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and rename actual_pickup_time to actual_pickup_datetime
SET @columnExists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customer_order'
      AND COLUMN_NAME = 'actual_pickup_time'
);

SET @newColumnExists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customer_order'
      AND COLUMN_NAME = 'actual_pickup_datetime'
);

SET @sql = IF(@columnExists > 0 AND @newColumnExists = 0,
    'ALTER TABLE customer_order CHANGE COLUMN actual_pickup_time actual_pickup_datetime TIMESTAMP NULL',
    'SELECT "⊘ Column actual_pickup_datetime already exists or actual_pickup_time not found" as Status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- STEP 3: Add Indexes for Performance
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 3: Adding indexes for performance' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- Helper to add index if not exists
DELIMITER //

DROP PROCEDURE IF EXISTS AddIndexIfNotExists//
CREATE PROCEDURE AddIndexIfNotExists(
    IN tableName VARCHAR(128),
    IN indexName VARCHAR(128),
    IN indexDefinition TEXT
)
BEGIN
    DECLARE indexExists INT;

    SELECT COUNT(*) INTO indexExists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = tableName
      AND INDEX_NAME = indexName;

    IF indexExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD INDEX ', indexName, ' ', indexDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('✓ Added index: ', indexName) as Status;
    ELSE
        SELECT CONCAT('⊘ Index already exists: ', indexName) as Status;
    END IF;
END//

DELIMITER ;

CALL AddIndexIfNotExists('customer_order', 'idx_verification_code', '(verification_code)');
CALL AddIndexIfNotExists('customer_order', 'idx_order_datetime', '(order_datetime)');
CALL AddIndexIfNotExists('customer_order', 'idx_gcash_ref', '(gcash_reference_number)');
CALL AddIndexIfNotExists('customer_order', 'idx_paymaya_ref', '(paymaya_reference_number)');
CALL AddIndexIfNotExists('customer_order', 'idx_order_source', '(order_source)');
CALL AddIndexIfNotExists('customer_order', 'idx_preorder', '(is_preorder)');
CALL AddIndexIfNotExists('customer_order', 'idx_kiosk_session', '(kiosk_session_id)');
CALL AddIndexIfNotExists('customer_order', 'idx_is_deleted', '(is_deleted)');

-- ============================================================================
-- STEP 4: Add Foreign Keys
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 4: Adding foreign keys' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- Check if foreign key exists
SET @fkExists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customer_order'
      AND CONSTRAINT_NAME = 'fk_payment_verified_by'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fkExists = 0,
    'ALTER TABLE customer_order ADD CONSTRAINT fk_payment_verified_by FOREIGN KEY (payment_verified_by) REFERENCES cashier(cashier_id) ON DELETE SET NULL',
    'SELECT "⊘ Foreign key fk_payment_verified_by already exists" as Status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- STEP 5: Add Unique Constraints
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 5: Adding unique constraints' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- Check if unique constraint exists
SET @uniqueExists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customer_order'
      AND CONSTRAINT_NAME = 'unique_verification_code'
);

-- Note: We're making this a regular index instead of unique to avoid conflicts
-- Verification codes can be duplicated across different days
CALL AddIndexIfNotExists('customer_order', 'idx_verification_date', '(verification_code, created_at)');

-- ============================================================================
-- STEP 6: Update Existing Records
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 6: Updating existing records with default values' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- Sync final_amount with total_amount for existing records
UPDATE customer_order
SET final_amount = total_amount
WHERE final_amount = 0.00 OR final_amount IS NULL;

SELECT CONCAT('✓ Updated final_amount for ', ROW_COUNT(), ' records') as Status;

-- Generate verification codes for existing orders that don't have them
UPDATE customer_order
SET verification_code = LPAD(FLOOR(100000 + RAND() * 900000), 6, '0')
WHERE verification_code = '000000' OR verification_code IS NULL OR verification_code = '';

SELECT CONCAT('✓ Generated verification codes for ', ROW_COUNT(), ' records') as Status;

-- Set order_datetime from created_at for existing records
UPDATE customer_order
SET order_datetime = created_at
WHERE order_datetime IS NULL;

SELECT CONCAT('✓ Set order_datetime for ', ROW_COUNT(), ' records') as Status;

-- ============================================================================
-- STEP 7: Add Triggers to Maintain Data Consistency
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 7: Creating triggers for automatic data sync' as '';
SELECT '═══════════════════════════════════════════════════' as '';

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
    IF NEW.verification_code = '000000' OR NEW.verification_code IS NULL OR NEW.verification_code = '' THEN
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

SELECT '✓ Created trigger: trg_sync_final_amount_insert' as Status;
SELECT '✓ Created trigger: trg_sync_final_amount_update' as Status;
SELECT '✓ Created trigger: trg_generate_verification_code' as Status;
SELECT '✓ Created trigger: trg_set_order_datetime' as Status;

-- ============================================================================
-- STEP 8: Cleanup Helper Procedures
-- ============================================================================

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DROP PROCEDURE IF EXISTS AddIndexIfNotExists;

-- ============================================================================
-- STEP 9: Verification and Summary
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 9: Verification and Summary' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- Count total orders
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

-- Verify all new columns exist
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'customer_order'
  AND COLUMN_NAME IN (
    'verification_code', 'order_datetime', 'final_amount',
    'kiosk_session_id', 'is_preorder', 'gcash_reference_number',
    'paymaya_reference_number', 'payment_verified_at', 'payment_verified_by',
    'order_source', 'is_deleted'
  )
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '' as '';
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
