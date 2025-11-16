import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, authenticateAdmin, authenticateCashier, optionalAuth } from '../middleware/auth.middleware';
import { validate, validateQuery, schemas } from '../middleware/validation.middleware';
import { uploadQRCode, uploadProductImage } from '../config/multer';

// Controllers
import * as authController from '../controllers/auth.controller';
import * as kioskController from '../controllers/kiosk.controller';
import * as orderController from '../controllers/order.controller';
import * as adminController from '../controllers/admin.controller';
import * as additionalController from '../controllers/additional.controller';
import * as refundController from '../controllers/refund.controller';
import * as wasteController from '../controllers/waste.controller';
import * as feedbackController from '../controllers/feedback.controller';
import * as promotionController from '../controllers/promotion.controller';

const router = Router();

// ==== PUBLIC ROUTES ====

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==== AUTH ROUTES ====
router.post('/auth/admin/login', validate(schemas.adminLogin), asyncHandler(authController.adminLogin));
router.post('/auth/cashier/login', validate(schemas.cashierLogin), asyncHandler(authController.cashierLogin));
router.get('/auth/verify', authenticate, asyncHandler(authController.verifyToken));

// ==== KIOSK ROUTES (Public/Optional Auth) ====
router.get('/kiosk/menu', optionalAuth, asyncHandler(kioskController.getMenuItems));
router.get('/kiosk/categories', asyncHandler(kioskController.getCategories));
router.get('/kiosk/menu/:id', asyncHandler(kioskController.getItemDetails));
router.get('/kiosk/promotions', asyncHandler(kioskController.getActivePromotions));
router.get('/kiosk/capacity/check', asyncHandler(kioskController.checkCapacity));

// Kiosk Orders
router.post('/kiosk/orders', validate(schemas.createOrder), asyncHandler(orderController.createOrder));
router.get('/kiosk/orders/:code', asyncHandler(orderController.getOrderByVerificationCode));

// ==== CASHIER ROUTES ====
router.post(
  '/cashier/orders/verify',
  authenticateCashier,
  validate(schemas.verifyOrder),
  asyncHandler(orderController.verifyOrder)
);

router.post(
  '/cashier/payment/verify',
  authenticateCashier,
  uploadQRCode.single('qr_code'),
  validate(schemas.verifyPayment),
  asyncHandler(orderController.verifyPayment)
);

router.get('/cashier/orders', authenticateCashier, asyncHandler(orderController.getOrders));
router.get('/cashier/orders/:id', authenticateCashier, asyncHandler(orderController.getOrderDetails));
router.get('/cashier/orders/:id/timeline', authenticateCashier, asyncHandler(additionalController.getOrderTimeline));
router.patch('/cashier/orders/:id/status', authenticateCashier, asyncHandler(orderController.updateOrderStatus));

// Cashier - Waste Tracking
router.post('/cashier/waste', authenticateCashier, asyncHandler(wasteController.createWasteEntry));
router.get('/cashier/waste', authenticateCashier, asyncHandler(wasteController.getWasteEntries));

// Cashier - Feedback Recording
router.post('/cashier/feedback', authenticateCashier, asyncHandler(feedbackController.submitFeedback));

// Cashier - Refund Requests
router.post('/cashier/refund', authenticateCashier, asyncHandler(refundController.createRefundRequest));
router.get('/cashier/refund', authenticateCashier, asyncHandler(refundController.getRefundRequests));
router.get('/cashier/refund/:id', authenticateCashier, asyncHandler(refundController.getRefundDetails));

// ==== ADMIN ROUTES ====

// Menu Management
router.post(
  '/admin/menu',
  authenticateAdmin,
  uploadProductImage.single('image'),
  validate(schemas.createMenuItem),
  asyncHandler(adminController.createMenuItem)
);

router.put(
  '/admin/menu/:id',
  authenticateAdmin,
  uploadProductImage.single('image'),
  validate(schemas.updateMenuItem),
  asyncHandler(adminController.updateMenuItem)
);

router.delete('/admin/menu/:id', authenticateAdmin, asyncHandler(adminController.deleteMenuItem));

// Pricing
router.post('/admin/menu/prices', authenticateAdmin, asyncHandler(adminController.addItemPrice));

// Categories
router.post(
  '/admin/categories',
  authenticateAdmin,
  uploadProductImage.single('image'),
  asyncHandler(adminController.createCategory)
);

router.put('/admin/categories/:id', authenticateAdmin, asyncHandler(adminController.updateCategory));
router.post('/admin/categories/assign', authenticateAdmin, asyncHandler(adminController.assignItemToCategory));

// Inventory
router.get('/admin/inventory/alerts', authenticateAdmin, asyncHandler(adminController.getInventoryAlerts));
router.patch('/admin/inventory/alerts/:id/acknowledge', authenticateAdmin, asyncHandler(adminController.acknowledgeAlert));
router.post('/admin/inventory/adjust', authenticateAdmin, asyncHandler(adminController.adjustInventory));

// Stock Adjustment Reasons
router.get('/admin/inventory/reasons', authenticateAdmin, asyncHandler(additionalController.getStockReasons));
router.post('/admin/inventory/reasons', authenticateAdmin, asyncHandler(additionalController.createStockReason));

// Analytics
router.get('/admin/analytics/sales', authenticateAdmin, asyncHandler(adminController.getSalesAnalytics));
router.get('/admin/analytics/trending', authenticateAdmin, asyncHandler(adminController.getTrendingItems));
router.get('/admin/analytics/waste', authenticateAdmin, asyncHandler(adminController.getWasteReport));
router.post('/admin/analytics/popularity/recalculate', authenticateAdmin, asyncHandler(adminController.recalculatePopularity));

// Stats & History
router.get('/admin/stats/daily', authenticateAdmin, asyncHandler(additionalController.getDailyStats));
router.get('/admin/stats/popularity-history', authenticateAdmin, asyncHandler(additionalController.getPopularityHistory));

// Promotions
router.post('/admin/promotions', authenticateAdmin, asyncHandler(adminController.createPromotion));
router.get('/admin/promotions', authenticateAdmin, asyncHandler(adminController.getPromotions));
router.put('/admin/promotions/:id', authenticateAdmin, asyncHandler(promotionController.updatePromotion));
router.delete('/admin/promotions/:id', authenticateAdmin, asyncHandler(promotionController.deletePromotion));

// Promotion Assignments
router.post('/admin/promotions/:id/items', authenticateAdmin, asyncHandler(promotionController.assignItemsToPromotion));
router.post('/admin/promotions/:id/categories', authenticateAdmin, asyncHandler(promotionController.assignCategoriesToPromotion));
router.get('/admin/promotions/:id/assignments', authenticateAdmin, asyncHandler(promotionController.getPromotionAssignments));
router.get('/admin/promotions/:id/usage', authenticateAdmin, asyncHandler(promotionController.getPromotionUsageLog));
router.get('/admin/promotions/applicable', authenticateAdmin, asyncHandler(promotionController.getApplicablePromotions));

// Feedback
router.get('/admin/feedback', authenticateAdmin, asyncHandler(adminController.getFeedback));
router.get('/admin/feedback/stats', authenticateAdmin, asyncHandler(feedbackController.getFeedbackStats));
router.post('/admin/feedback/:id/respond', authenticateAdmin, asyncHandler(adminController.respondToFeedback));

// Orders (Admin can see all)
router.get('/admin/orders', authenticateAdmin, asyncHandler(orderController.getOrders));
router.get('/admin/orders/:id', authenticateAdmin, asyncHandler(orderController.getOrderDetails));
router.get('/admin/orders/:id/timeline', authenticateAdmin, asyncHandler(additionalController.getOrderTimeline));
router.patch('/admin/orders/:id/status', authenticateAdmin, asyncHandler(orderController.updateOrderStatus));

// Customer Management
router.post('/admin/customers', authenticateAdmin, asyncHandler(additionalController.createCustomer));
router.get('/admin/customers', authenticateAdmin, asyncHandler(additionalController.getCustomers));
router.get('/admin/customers/:id', authenticateAdmin, asyncHandler(additionalController.getCustomer));
router.put('/admin/customers/:id', authenticateAdmin, asyncHandler(additionalController.updateCustomer));

// Supplier Management
router.post('/admin/suppliers', authenticateAdmin, asyncHandler(additionalController.createSupplier));
router.get('/admin/suppliers', authenticateAdmin, asyncHandler(additionalController.getSuppliers));
router.put('/admin/suppliers/:id', authenticateAdmin, asyncHandler(additionalController.updateSupplier));
router.delete('/admin/suppliers/:id', authenticateAdmin, asyncHandler(additionalController.deleteSupplier));

// Cashier Management
router.post('/admin/cashiers', authenticateAdmin, asyncHandler(additionalController.createCashier));
router.get('/admin/cashiers', authenticateAdmin, asyncHandler(additionalController.getCashiers));
router.put('/admin/cashiers/:id', authenticateAdmin, asyncHandler(additionalController.updateCashier));
router.delete('/admin/cashiers/:id', authenticateAdmin, asyncHandler(additionalController.deleteCashier));

// Tax Rules
router.post('/admin/tax-rules', authenticateAdmin, asyncHandler(additionalController.createTaxRule));
router.get('/admin/tax-rules', authenticateAdmin, asyncHandler(additionalController.getTaxRules));
router.put('/admin/tax-rules/:id', authenticateAdmin, asyncHandler(additionalController.updateTaxRule));

// Cake Customization Management
// Flavors
router.post('/admin/cake/flavors', authenticateAdmin, uploadProductImage.single('image'), asyncHandler(additionalController.createFlavor));
router.get('/admin/cake/flavors', authenticateAdmin, asyncHandler(additionalController.getFlavors));
router.put('/admin/cake/flavors/:id', authenticateAdmin, uploadProductImage.single('image'), asyncHandler(additionalController.updateFlavor));

// Sizes
router.post('/admin/cake/sizes', authenticateAdmin, asyncHandler(additionalController.createSize));
router.get('/admin/cake/sizes', authenticateAdmin, asyncHandler(additionalController.getSizes));
router.put('/admin/cake/sizes/:id', authenticateAdmin, asyncHandler(additionalController.updateSize));

// Themes
router.post('/admin/cake/themes', authenticateAdmin, uploadProductImage.single('image'), asyncHandler(additionalController.createTheme));
router.get('/admin/cake/themes', authenticateAdmin, asyncHandler(additionalController.getThemes));
router.put('/admin/cake/themes/:id', authenticateAdmin, uploadProductImage.single('image'), asyncHandler(additionalController.updateTheme));

// Kiosk Settings
router.get('/admin/kiosk-settings', authenticateAdmin, asyncHandler(additionalController.getKioskSettings));
router.post('/admin/kiosk-settings', authenticateAdmin, asyncHandler(additionalController.createKioskSetting));
router.put('/admin/kiosk-settings/:key', authenticateAdmin, asyncHandler(additionalController.updateKioskSetting));

// Refund Management (Admin Only)
router.get('/admin/refund', authenticateAdmin, asyncHandler(refundController.getRefundRequests));
router.get('/admin/refund/:id', authenticateAdmin, asyncHandler(refundController.getRefundDetails));
router.post('/admin/refund/:id/approve', authenticateAdmin, asyncHandler(refundController.approveRefund));
router.post('/admin/refund/:id/reject', authenticateAdmin, asyncHandler(refundController.rejectRefund));
router.post('/admin/refund/:id/complete', authenticateAdmin, asyncHandler(refundController.completeRefund));

// Waste Tracking (Admin can view all)
router.get('/admin/waste', authenticateAdmin, asyncHandler(wasteController.getWasteEntries));
router.get('/admin/waste/summary', authenticateAdmin, asyncHandler(wasteController.getWasteSummary));
router.post('/admin/waste', authenticateAdmin, asyncHandler(wasteController.createWasteEntry));

export default router;
