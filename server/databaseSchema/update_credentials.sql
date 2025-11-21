-- ============================================================================
-- GOLDEN MUNCH POS - Update Credentials with Node.js Compatible Hashes
-- ============================================================================
-- Purpose: Replace PHP bcrypt hashes with Node.js bcrypt compatible hashes
-- Run this after initial database setup to fix authentication issues
-- ============================================================================

USE GoldenMunchPOS;

-- Update Admin password hash (password: "password")
UPDATE admin
SET password_hash = '$2b$10$CXizOigTmnkp0RTmFSF2D.rfmDhi9A4TTLK0CFmHNhRWMhQAT5DYG'
WHERE username = 'admin';

-- Update Cashier PIN hash (PIN: "1234")
UPDATE cashier
SET pin_hash = '$2b$10$fEDASegIWOnbGTzD0pEA9u/5rHLpLAS2tEqn8782ryWHLp1eYYsTG'
WHERE cashier_code = 'CASH001';

-- Verify the updates
SELECT 'Credentials updated successfully!' as status;
SELECT '' as '';
SELECT 'Admin Login:' as '';
SELECT '  Username: admin' as '';
SELECT '  Password: password' as '';
SELECT '' as '';
SELECT 'Cashier Login:' as '';
SELECT '  Cashier Code: CASH001' as '';
SELECT '  PIN: 1234' as '';
SELECT '' as '';
SELECT '⚠️  Remember to change these default credentials after first login!' as '';
