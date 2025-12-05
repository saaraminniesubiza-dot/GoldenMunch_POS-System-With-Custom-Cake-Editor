/**
 * Enhanced Custom Cake Routes
 * Import these routes in index.ts
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticateAdmin } from '../middleware/auth.middleware';
import * as enhancedController from '../controllers/customCakeEnhanced.controller';

const router = Router();

// ============================================================================
// CUSTOMER ENDPOINTS (Public - no authentication required)
// ============================================================================

// Submit design with contact confirmation
router.post(
  '/custom-cake/submit-with-confirmation',
  asyncHandler(enhancedController.submitWithConfirmation)
);

// Track order
router.get(
  '/custom-cake/track/:trackingCode',
  asyncHandler(enhancedController.getTrackingInfo)
);

// Upload payment receipt
router.post(
  '/custom-cake/payment/upload-receipt',
  asyncHandler(enhancedController.uploadPaymentReceipt)
);

// Cancel request
router.post(
  '/custom-cake/:trackingCode/cancel',
  asyncHandler(enhancedController.cancelRequest)
);

// Submit feedback
router.post(
  '/custom-cake/:trackingCode/feedback',
  asyncHandler(enhancedController.submitFeedback)
);

// ============================================================================
// ADMIN ENDPOINTS (Requires authentication)
// ============================================================================

// Dashboard statistics
router.get(
  '/admin/custom-cakes/dashboard-stats',
  authenticateAdmin,
  asyncHandler(enhancedController.getDashboardStats)
);

// Get requests by status
router.get(
  '/admin/custom-cakes/by-status/:status',
  authenticateAdmin,
  asyncHandler(enhancedController.getRequestsByStatus)
);

// Create and send quote
router.post(
  '/admin/custom-cakes/:requestId/create-quote',
  authenticateAdmin,
  asyncHandler(enhancedController.createQuote)
);

// Get payment receipts
router.get(
  '/admin/custom-cakes/:requestId/receipts',
  authenticateAdmin,
  asyncHandler(enhancedController.getPaymentReceipts)
);

// Verify payment
router.post(
  '/admin/custom-cakes/:requestId/verify-payment',
  authenticateAdmin,
  asyncHandler(enhancedController.verifyPayment)
);

// Schedule pickup
router.post(
  '/admin/custom-cakes/:requestId/schedule-pickup',
  authenticateAdmin,
  asyncHandler(enhancedController.schedulePickup)
);

// Update production status
router.post(
  '/admin/custom-cakes/:requestId/update-status',
  authenticateAdmin,
  asyncHandler(enhancedController.updateProductionStatus)
);

// Request design revision
router.post(
  '/admin/custom-cakes/:requestId/request-revision',
  authenticateAdmin,
  asyncHandler(enhancedController.requestRevision)
);

export default router;
