# Routes Update Guide

## How to Add Enhanced Custom Cake Routes

### Step 1: Import the enhanced routes

At the top of `/server/src/routes/index.ts`, add this import:

```typescript
import customCakeEnhancedRoutes from './customCakeEnhanced.routes';
```

### Step 2: Mount the enhanced routes

After line 407 (after the existing custom cake routes), add:

```typescript
// ==== ENHANCED CUSTOM CAKE WORKFLOW ROUTES ====
router.use('/', customCakeEnhancedRoutes);
```

That's it! All the new enhanced routes will be available at:

### Customer Routes (Public):
- `POST /api/custom-cake/submit-with-confirmation`
- `GET /api/custom-cake/track/:trackingCode`
- `POST /api/custom-cake/payment/upload-receipt`
- `POST /api/custom-cake/:trackingCode/cancel`
- `POST /api/custom-cake/:trackingCode/feedback`

### Admin Routes (Authenticated):
- `GET /api/admin/custom-cakes/dashboard-stats`
- `GET /api/admin/custom-cakes/by-status/:status`
- `POST /api/admin/custom-cakes/:requestId/create-quote`
- `GET /api/admin/custom-cakes/:requestId/receipts`
- `POST /api/admin/custom-cakes/:requestId/verify-payment`
- `POST /api/admin/custom-cakes/:requestId/schedule-pickup`
- `POST /api/admin/custom-cakes/:requestId/update-status`
- `POST /api/admin/custom-cakes/:requestId/request-revision`

## Alternative: Manual Route Addition

If you prefer not to use a separate routes file, you can add these directly to `index.ts`:

```typescript
// After line 407, add:

// ==== ENHANCED CUSTOM CAKE WORKFLOW ====
import * as customCakeEnhanced from '../controllers/customCakeEnhanced.controller';

// Customer endpoints
router.post('/custom-cake/submit-with-confirmation', asyncHandler(customCakeEnhanced.submitWithConfirmation));
router.get('/custom-cake/track/:trackingCode', asyncHandler(customCakeEnhanced.getTrackingInfo));
router.post('/custom-cake/payment/upload-receipt', asyncHandler(customCakeEnhanced.uploadPaymentReceipt));
router.post('/custom-cake/:trackingCode/cancel', asyncHandler(customCakeEnhanced.cancelRequest));
router.post('/custom-cake/:trackingCode/feedback', asyncHandler(customCakeEnhanced.submitFeedback));

// Admin endpoints
router.get('/admin/custom-cakes/dashboard-stats', authenticateAdmin, asyncHandler(customCakeEnhanced.getDashboardStats));
router.get('/admin/custom-cakes/by-status/:status', authenticateAdmin, asyncHandler(customCakeEnhanced.getRequestsByStatus));
router.post('/admin/custom-cakes/:requestId/create-quote', authenticateAdmin, asyncHandler(customCakeEnhanced.createQuote));
router.get('/admin/custom-cakes/:requestId/receipts', authenticateAdmin, asyncHandler(customCakeEnhanced.getPaymentReceipts));
router.post('/admin/custom-cakes/:requestId/verify-payment', authenticateAdmin, asyncHandler(customCakeEnhanced.verifyPayment));
router.post('/admin/custom-cakes/:requestId/schedule-pickup', authenticateAdmin, asyncHandler(customCakeEnhanced.schedulePickup));
router.post('/admin/custom-cakes/:requestId/update-status', authenticateAdmin, asyncHandler(customCakeEnhanced.updateProductionStatus));
router.post('/admin/custom-cakes/:requestId/request-revision', authenticateAdmin, asyncHandler(customCakeEnhanced.requestRevision));
```
