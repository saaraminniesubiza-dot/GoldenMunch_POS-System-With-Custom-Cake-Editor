-- Migration: Add kiosk_setting table for key-value configuration storage
-- This table stores system-wide settings including payment QR codes

-- Create the kiosk_setting table
CREATE TABLE IF NOT EXISTS kiosk_setting (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description VARCHAR(255),
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin(admin_id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB COMMENT='System-wide key-value settings storage';

-- Insert default kiosk settings
INSERT INTO kiosk_setting (setting_key, setting_value, setting_type, description, updated_by) VALUES
('kiosk_timeout_seconds', '120', 'number', 'Seconds before kiosk session times out', 1),
('enable_loyalty_program', 'true', 'boolean', 'Enable loyalty points system', 1),
('loyalty_points_per_peso', '0.1', 'number', 'Loyalty points earned per peso spent', 1),
('min_preorder_hours', '24', 'number', 'Minimum hours before pickup for pre-orders', 1),
('min_custom_cake_days', '3', 'number', 'Minimum days before pickup for custom cakes', 1),
('max_cart_items', '50', 'number', 'Maximum items allowed in cart', 1),
('enable_custom_cakes', 'true', 'boolean', 'Enable custom cake ordering', 1),
('tax_rate', '0.12', 'number', 'VAT/Tax rate (12%)', 1),
('store_name', 'GoldenMunch Bakery', 'string', 'Store display name', 1),
('support_email', 'support@goldenmunch.com', 'string', 'Customer support email', 1),
('support_phone', '+63-XXX-XXX-XXXX', 'string', 'Customer support phone', 1)
ON DUPLICATE KEY UPDATE
    setting_value = VALUES(setting_value),
    description = VALUES(description);

-- Note: Payment QR codes (gcash_qr_code_url, paymaya_qr_code_url)
-- will be added when uploaded via the admin interface
