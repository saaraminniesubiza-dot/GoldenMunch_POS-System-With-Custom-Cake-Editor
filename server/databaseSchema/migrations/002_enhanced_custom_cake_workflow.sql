-- ============================================================================
-- MIGRATION 002: Enhanced Custom Cake Workflow
-- ============================================================================
-- Description: Adds payment verification, quote management, and tracking
-- Date: 2024-12-05
-- Author: GoldenMunch Development Team
-- ============================================================================

-- ============================================================================
-- STEP 1: Update custom_cake_request table with new fields
-- ============================================================================

-- Add new status values to enum
ALTER TABLE custom_cake_request
  MODIFY status ENUM(
    'draft',
    'pending_review',
    'quoted',
    'payment_pending_verification',
    'payment_verified',
    'scheduled',
    'in_production',
    'ready_for_pickup',
    'completed',
    'cancelled',
    'rejected',
    'revision_requested'
  ) DEFAULT 'draft'
  COMMENT 'Order status throughout lifecycle';

-- Quote Phase Fields
ALTER TABLE custom_cake_request
  ADD COLUMN IF NOT EXISTS quoted_price DECIMAL(10,2) NULL
    COMMENT 'Custom price set by admin after review',
  ADD COLUMN IF NOT EXISTS quote_notes TEXT NULL
    COMMENT 'Admin notes explaining the quote',
  ADD COLUMN IF NOT EXISTS quote_breakdown JSON NULL
    COMMENT 'Detailed price breakdown {base, layers, decorations, complexity}',
  ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMP NULL
    COMMENT 'When admin sent the quote',
  ADD COLUMN IF NOT EXISTS quoted_by INT NULL
    COMMENT 'Admin who created the quote';

-- Payment Phase Fields
ALTER TABLE custom_cake_request
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NULL
    COMMENT 'How customer will pay: gcash, bank_transfer, etc',
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100) NULL
    COMMENT 'Reference number from payment',
  ADD COLUMN IF NOT EXISTS payment_receipt_url VARCHAR(500) NULL
    COMMENT 'Main receipt image URL',
  ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2) NULL
    COMMENT 'Amount customer claims to have paid',
  ADD COLUMN IF NOT EXISTS payment_uploaded_at TIMESTAMP NULL
    COMMENT 'When customer uploaded receipt';

-- Payment Verification Fields
ALTER TABLE custom_cake_request
  ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE
    COMMENT 'Whether admin verified the payment',
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP NULL
    COMMENT 'When payment was verified',
  ADD COLUMN IF NOT EXISTS payment_verified_by INT NULL
    COMMENT 'Admin who verified payment',
  ADD COLUMN IF NOT EXISTS payment_verification_notes TEXT NULL
    COMMENT 'Admin notes about payment verification';

-- Revision Fields
ALTER TABLE custom_cake_request
  ADD COLUMN IF NOT EXISTS revision_count INT DEFAULT 0
    COMMENT 'How many times design was revised',
  ADD COLUMN IF NOT EXISTS revision_notes TEXT NULL
    COMMENT 'Admin notes requesting changes',
  ADD COLUMN IF NOT EXISTS last_revised_at TIMESTAMP NULL;

-- Tracking & Communication
ALTER TABLE custom_cake_request
  ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(50) UNIQUE NULL
    COMMENT 'Customer-friendly tracking code (e.g., CAKE-2024-001)',
  ADD COLUMN IF NOT EXISTS customer_notes TEXT NULL
    COMMENT 'Customer notes during payment/updates',
  ADD COLUMN IF NOT EXISTS internal_notes TEXT NULL
    COMMENT 'Internal staff communication';

-- Production Fields
ALTER TABLE custom_cake_request
  ADD COLUMN IF NOT EXISTS production_started_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS production_completed_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS assigned_baker_id INT NULL
    COMMENT 'Staff assigned to make the cake';

-- Pickup Fields
ALTER TABLE custom_cake_request
  ADD COLUMN IF NOT EXISTS actual_pickup_date TIMESTAMP NULL
    COMMENT 'When customer actually picked up',
  ADD COLUMN IF NOT EXISTS picked_up_by VARCHAR(100) NULL
    COMMENT 'Name of person who picked up';

-- Rating & Feedback
ALTER TABLE custom_cake_request
  ADD COLUMN IF NOT EXISTS customer_rating INT NULL CHECK (customer_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS customer_feedback TEXT NULL,
  ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP NULL;

-- Add Foreign Keys (if they don't exist)
ALTER TABLE custom_cake_request
  ADD CONSTRAINT IF NOT EXISTS fk_quoted_by
    FOREIGN KEY (quoted_by) REFERENCES admin(admin_id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_payment_verified_by
    FOREIGN KEY (payment_verified_by) REFERENCES admin(admin_id) ON DELETE SET NULL;

-- Add Indexes
ALTER TABLE custom_cake_request
  ADD INDEX IF NOT EXISTS idx_tracking_code (tracking_code),
  ADD INDEX IF NOT EXISTS idx_payment_status (payment_verified, status),
  ADD INDEX IF NOT EXISTS idx_production_status (status, scheduled_pickup_date);

-- ============================================================================
-- STEP 2: Create custom_cake_payment_receipts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_cake_payment_receipts (
  receipt_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,

  -- Receipt Details
  receipt_url VARCHAR(500) NOT NULL COMMENT 'Image/PDF URL or base64 data',
  receipt_type ENUM('image', 'pdf') DEFAULT 'image',
  file_size INT COMMENT 'File size in bytes',
  original_filename VARCHAR(255) NULL,

  -- Payment Info
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100) NULL,
  payment_date DATE NULL COMMENT 'Date on the receipt',

  -- Upload Info
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by_email VARCHAR(100) NULL,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP NULL,
  verified_by INT NULL COMMENT 'Admin who verified',
  verification_status ENUM('pending', 'approved', 'rejected', 'needs_clarification') DEFAULT 'pending',
  verification_notes TEXT NULL,

  -- Metadata
  is_primary BOOLEAN DEFAULT FALSE COMMENT 'Main receipt for this request',
  replaced_by INT NULL COMMENT 'If customer uploaded new receipt',

  FOREIGN KEY (request_id) REFERENCES custom_cake_request(request_id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES admin(admin_id) ON DELETE SET NULL,
  FOREIGN KEY (replaced_by) REFERENCES custom_cake_payment_receipts(receipt_id) ON DELETE SET NULL,

  INDEX idx_request (request_id),
  INDEX idx_verification_status (verification_status),
  INDEX idx_primary_receipt (request_id, is_primary)
) ENGINE=InnoDB
  COMMENT 'Stores payment receipt uploads and verification status';

-- ============================================================================
-- STEP 3: Create custom_cake_status_history table
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_cake_status_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,

  -- Status Change
  old_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by INT NULL COMMENT 'User who triggered change',
  changed_by_type ENUM('customer', 'admin', 'cashier', 'system') DEFAULT 'system',

  -- Context
  change_reason TEXT NULL,
  metadata JSON NULL COMMENT 'Additional context about the change',

  FOREIGN KEY (request_id) REFERENCES custom_cake_request(request_id) ON DELETE CASCADE,

  INDEX idx_request (request_id),
  INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB
  COMMENT 'Audit trail of all status changes';

-- ============================================================================
-- STEP 4: Create trigger for automatic status history tracking
-- ============================================================================

DROP TRIGGER IF EXISTS tr_custom_cake_status_change;

DELIMITER //

CREATE TRIGGER tr_custom_cake_status_change
AFTER UPDATE ON custom_cake_request
FOR EACH ROW
BEGIN
  -- Only log if status actually changed
  IF OLD.status != NEW.status THEN
    INSERT INTO custom_cake_status_history
      (request_id, old_status, new_status, changed_at, changed_by_type)
    VALUES
      (NEW.request_id, OLD.status, NEW.status, NOW(), 'system');
  END IF;
END//

DELIMITER ;

-- ============================================================================
-- STEP 5: Create function to generate tracking codes
-- ============================================================================

DROP FUNCTION IF EXISTS generate_tracking_code;

DELIMITER //

CREATE FUNCTION generate_tracking_code(request_id INT)
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
  DECLARE year_part VARCHAR(4);
  DECLARE id_part VARCHAR(10);
  DECLARE tracking_code VARCHAR(50);

  SET year_part = YEAR(NOW());
  SET id_part = LPAD(request_id, 5, '0');
  SET tracking_code = CONCAT('CAKE-', year_part, '-', id_part);

  RETURN tracking_code;
END//

DELIMITER ;

-- ============================================================================
-- STEP 6: Update existing records with tracking codes
-- ============================================================================

UPDATE custom_cake_request
SET tracking_code = generate_tracking_code(request_id)
WHERE tracking_code IS NULL;

-- ============================================================================
-- STEP 7: Create/Update views for admin dashboard
-- ============================================================================

DROP VIEW IF EXISTS v_custom_cake_dashboard;

CREATE VIEW v_custom_cake_dashboard AS
SELECT
  ccr.*,
  -- Admin names
  qa.username as quoted_by_name,
  va.username as verified_by_name,
  ra.username as reviewed_by_name,
  -- Customer info
  c.customer_tier,
  c.total_spent as customer_lifetime_value,
  -- Timing calculations
  DATEDIFF(ccr.scheduled_pickup_date, NOW()) as days_until_pickup,
  TIMESTAMPDIFF(HOUR, ccr.submitted_at, ccr.quoted_at) as hours_to_quote,
  TIMESTAMPDIFF(HOUR, ccr.payment_uploaded_at, ccr.payment_verified_at) as hours_to_verify_payment,
  -- Status flags
  CASE
    WHEN ccr.status = 'pending_review' THEN 'URGENT: Needs Review'
    WHEN ccr.status = 'payment_pending_verification' THEN 'URGENT: Verify Payment'
    WHEN ccr.status = 'payment_verified' THEN 'ACTION: Schedule Pickup'
    WHEN ccr.status = 'scheduled' AND DATEDIFF(ccr.scheduled_pickup_date, NOW()) <= 2 THEN 'START PRODUCTION'
    WHEN ccr.status = 'in_production' THEN 'IN PROGRESS'
    WHEN ccr.status = 'ready_for_pickup' AND ccr.scheduled_pickup_date < NOW() THEN 'OVERDUE PICKUP'
    ELSE 'OK'
  END as action_required,
  -- Receipt count
  (SELECT COUNT(*) FROM custom_cake_payment_receipts WHERE request_id = ccr.request_id) as receipt_count,
  -- Latest receipt status
  (SELECT verification_status FROM custom_cake_payment_receipts
   WHERE request_id = ccr.request_id AND is_primary = TRUE LIMIT 1) as latest_receipt_status
FROM custom_cake_request ccr
LEFT JOIN admin qa ON ccr.quoted_by = qa.admin_id
LEFT JOIN admin va ON ccr.payment_verified_by = va.admin_id
LEFT JOIN admin ra ON ccr.reviewed_by = ra.admin_id
LEFT JOIN customer c ON ccr.customer_phone = c.phone
WHERE ccr.status != 'completed'
  AND ccr.status != 'cancelled'
  AND ccr.status != 'rejected'
ORDER BY
  FIELD(ccr.status,
    'payment_pending_verification',
    'pending_review',
    'payment_verified',
    'scheduled',
    'in_production',
    'ready_for_pickup'
  ),
  ccr.submitted_at ASC;

-- ============================================================================
-- STEP 8: Create view for payment verification queue
-- ============================================================================

DROP VIEW IF EXISTS v_payment_verification_queue;

CREATE VIEW v_payment_verification_queue AS
SELECT
  ccr.request_id,
  ccr.tracking_code,
  ccr.customer_name,
  ccr.customer_email,
  ccr.customer_phone,
  ccr.quoted_price,
  ccr.payment_amount,
  ccr.payment_method,
  ccr.payment_reference,
  ccr.payment_uploaded_at,
  ccpr.receipt_id,
  ccpr.receipt_url,
  ccpr.receipt_type,
  ccpr.verification_status,
  ccpr.is_primary,
  TIMESTAMPDIFF(HOUR, ccr.payment_uploaded_at, NOW()) as hours_waiting,
  -- Flag if amount doesn't match
  CASE
    WHEN ccr.payment_amount < ccr.quoted_price THEN 'UNDERPAID'
    WHEN ccr.payment_amount > ccr.quoted_price THEN 'OVERPAID'
    ELSE 'EXACT'
  END as payment_match
FROM custom_cake_request ccr
INNER JOIN custom_cake_payment_receipts ccpr ON ccr.request_id = ccpr.request_id
WHERE ccr.status = 'payment_pending_verification'
  AND ccpr.is_primary = TRUE
ORDER BY ccr.payment_uploaded_at ASC;

-- ============================================================================
-- STEP 9: Create stored procedure for complete request details
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_get_custom_cake_full_details;

DELIMITER //

CREATE PROCEDURE sp_get_custom_cake_full_details(IN p_request_id INT)
BEGIN
  -- Main request details
  SELECT
    ccr.*,
    qa.username as quoted_by_name,
    va.username as verified_by_name,
    ra.username as reviewed_by_name,
    ct.theme_name,
    ct.description as theme_description
  FROM custom_cake_request ccr
  LEFT JOIN admin qa ON ccr.quoted_by = qa.admin_id
  LEFT JOIN admin va ON ccr.payment_verified_by = va.admin_id
  LEFT JOIN admin ra ON ccr.reviewed_by = ra.admin_id
  LEFT JOIN custom_cake_theme ct ON ccr.theme_id = ct.theme_id
  WHERE ccr.request_id = p_request_id;

  -- Layer details with flavor and size names
  SELECT
    1 as layer_number,
    cf1.flavor_name as flavor_name,
    cs1.size_name as size_name,
    cs1.diameter_cm
  FROM custom_cake_request ccr
  LEFT JOIN cake_flavors cf1 ON ccr.layer_1_flavor_id = cf1.flavor_id
  LEFT JOIN cake_sizes cs1 ON ccr.layer_1_size_id = cs1.size_id
  WHERE ccr.request_id = p_request_id AND ccr.num_layers >= 1
  UNION ALL
  SELECT
    2 as layer_number,
    cf2.flavor_name,
    cs2.size_name,
    cs2.diameter_cm
  FROM custom_cake_request ccr
  LEFT JOIN cake_flavors cf2 ON ccr.layer_2_flavor_id = cf2.flavor_id
  LEFT JOIN cake_sizes cs2 ON ccr.layer_2_size_id = cs2.size_id
  WHERE ccr.request_id = p_request_id AND ccr.num_layers >= 2
  UNION ALL
  SELECT
    3 as layer_number,
    cf3.flavor_name,
    cs3.size_name,
    cs3.diameter_cm
  FROM custom_cake_request ccr
  LEFT JOIN cake_flavors cf3 ON ccr.layer_3_flavor_id = cf3.flavor_id
  LEFT JOIN cake_sizes cs3 ON ccr.layer_3_size_id = cs3.size_id
  WHERE ccr.request_id = p_request_id AND ccr.num_layers >= 3
  UNION ALL
  SELECT
    4 as layer_number,
    cf4.flavor_name,
    cs4.size_name,
    cs4.diameter_cm
  FROM custom_cake_request ccr
  LEFT JOIN cake_flavors cf4 ON ccr.layer_4_flavor_id = cf4.flavor_id
  LEFT JOIN cake_sizes cs4 ON ccr.layer_4_size_id = cs4.size_id
  WHERE ccr.request_id = p_request_id AND ccr.num_layers >= 4
  UNION ALL
  SELECT
    5 as layer_number,
    cf5.flavor_name,
    cs5.size_name,
    cs5.diameter_cm
  FROM custom_cake_request ccr
  LEFT JOIN cake_flavors cf5 ON ccr.layer_5_flavor_id = cf5.flavor_id
  LEFT JOIN cake_sizes cs5 ON ccr.layer_5_size_id = cs5.size_id
  WHERE ccr.request_id = p_request_id AND ccr.num_layers >= 5
  ORDER BY layer_number;

  -- Images
  SELECT *
  FROM custom_cake_request_images
  WHERE request_id = p_request_id
  ORDER BY uploaded_at DESC;

  -- Payment receipts
  SELECT
    ccpr.*,
    a.username as verified_by_name
  FROM custom_cake_payment_receipts ccpr
  LEFT JOIN admin a ON ccpr.verified_by = a.admin_id
  WHERE ccpr.request_id = p_request_id
  ORDER BY ccpr.uploaded_at DESC;

  -- Status history
  SELECT *
  FROM custom_cake_status_history
  WHERE request_id = p_request_id
  ORDER BY changed_at ASC;
END//

DELIMITER ;

-- ============================================================================
-- STEP 10: Create stored procedure for dashboard stats
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_get_custom_cake_dashboard_stats;

DELIMITER //

CREATE PROCEDURE sp_get_custom_cake_dashboard_stats()
BEGIN
  SELECT
    COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review,
    COUNT(CASE WHEN status = 'payment_pending_verification' THEN 1 END) as pending_payment_verification,
    COUNT(CASE WHEN status = 'payment_verified' THEN 1 END) as needs_scheduling,
    COUNT(CASE WHEN status = 'in_production' THEN 1 END) as in_production,
    COUNT(CASE WHEN status = 'ready_for_pickup' THEN 1 END) as ready_for_pickup,
    SUM(CASE WHEN status NOT IN ('completed', 'cancelled', 'rejected') AND quoted_price IS NOT NULL
        THEN quoted_price ELSE 0 END) as total_revenue_pending,
    SUM(CASE WHEN payment_verified = TRUE THEN quoted_price ELSE 0 END) as total_revenue_verified,
    AVG(CASE WHEN quoted_at IS NOT NULL
        THEN TIMESTAMPDIFF(HOUR, submitted_at, quoted_at) END) as avg_review_time_hours,
    AVG(CASE WHEN payment_verified_at IS NOT NULL
        THEN TIMESTAMPDIFF(HOUR, payment_uploaded_at, payment_verified_at) END) as avg_verification_time_hours
  FROM custom_cake_request
  WHERE status NOT IN ('completed', 'cancelled', 'rejected')
     OR created_at > DATE_SUB(NOW(), INTERVAL 30 DAY);
END//

DELIMITER ;

-- ============================================================================
-- STEP 11: Add notification type for new workflow stages
-- ============================================================================

-- Update notification types in custom_cake_notifications table
ALTER TABLE custom_cake_notifications
  MODIFY notification_type ENUM(
    'submission_received',
    'quote_ready',
    'payment_receipt_uploaded',
    'payment_verified',
    'payment_rejected',
    'scheduled',
    'production_started',
    'ready_for_pickup',
    'pickup_reminder',
    'cancelled',
    'rejected',
    'revision_requested',
    'needs_clarification'
  ) NOT NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
SELECT 'Migration 002 completed successfully!' as message;

-- Show counts
SELECT
  COUNT(*) as total_requests,
  COUNT(CASE WHEN tracking_code IS NOT NULL THEN 1 END) as requests_with_tracking,
  (SELECT COUNT(*) FROM custom_cake_payment_receipts) as total_receipts,
  (SELECT COUNT(*) FROM custom_cake_status_history) as total_history_entries
FROM custom_cake_request;
