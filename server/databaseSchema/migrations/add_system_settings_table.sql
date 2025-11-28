-- Migration: Add system_settings table for application-wide configuration
-- Created: 2025-11-29
-- Purpose: Store system-wide settings like payment QR codes

CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Whether setting can be accessed without authentication',
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public),
    FOREIGN KEY (updated_by) REFERENCES admin(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Insert initial payment QR code settings (placeholders)
INSERT INTO system_settings (setting_key, setting_type, description, is_public)
VALUES
    ('gcash_qr_code_url', 'string', 'GCash payment QR code image URL', TRUE),
    ('paymaya_qr_code_url', 'string', 'PayMaya payment QR code image URL', TRUE)
ON DUPLICATE KEY UPDATE setting_key = setting_key;
