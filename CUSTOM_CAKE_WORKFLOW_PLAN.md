# 🎂 Custom Cake Ordering System - Comprehensive Implementation Plan

## 📋 Table of Contents
1. [Overview](#overview)
2. [New Workflow](#new-workflow)
3. [Database Schema Changes](#database-schema-changes)
4. [TypeScript Interfaces](#typescript-interfaces)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Features & Enhancements](#features--enhancements)
8. [Implementation Checklist](#implementation-checklist)

---

## 🎯 Overview

### Current Issues
- Admin approves BEFORE payment (backwards flow)
- No payment receipt verification
- No contact details confirmation before submission
- Missing payment tracking
- Limited status granularity

### Goals
✅ Customer confirms contact details before submission
✅ Admin reviews and sets custom price
✅ Customer uploads payment receipt
✅ Admin verifies payment before scheduling
✅ Admin schedules pickup after payment verification
✅ Full TypeScript safety with proper interfaces
✅ Comprehensive error handling
✅ Enhanced tracking and notifications

---

## 🔄 New Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: CUSTOMER DESIGN                                    │
└─────────────────────────────────────────────────────────────┘
1. Customer scans QR at kiosk
2. Designs cake in mobile editor (8 steps)
3. Auto-saves as 'draft' status
4. ✨ NEW: Confirmation modal shows:
   - Contact details review
   - "Are you sure?" prompt
   - Notice: "We'll contact you at this email/phone"
   - Terms acceptance checkbox
5. Customer confirms and submits
   → Status: 'pending_review'

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: ADMIN REVIEW & QUOTE                               │
└─────────────────────────────────────────────────────────────┘
6. Admin sees complete request details:
   - All design specifications
   - Customer contact info
   - 3D renders (all angles)
   - Event details
   - Dietary restrictions
   - Special instructions
7. Admin analyzes complexity and sets custom price:
   - Uses price calculator helper
   - Adds quote notes/breakdown
   - Sets preparation time estimate
8. Admin sends quote
   → Status: 'quoted'
9. ✨ Customer receives email with:
   - Quote details
   - Price breakdown
   - Payment instructions
   - Unique tracking link

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: CUSTOMER PAYMENT                                   │
└─────────────────────────────────────────────────────────────┘
10. Customer makes payment (bank transfer/GCash/etc)
11. Customer visits tracking link
12. ✨ Customer uploads payment receipt:
    - Image/PDF upload
    - Payment details form (amount, method, reference)
    - Upload timestamp
    → Status: 'payment_pending_verification'
13. ✨ Admin receives notification

┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: ADMIN PAYMENT VERIFICATION                         │
└─────────────────────────────────────────────────────────────┘
14. Admin reviews payment receipt:
    - Views uploaded receipt image
    - Checks payment amount
    - Verifies payment reference
15. Admin actions:
    - ✅ APPROVE: Verify payment
    - ❌ REJECT: Request re-upload (wrong receipt)
    - 💬 REQUEST INFO: Ask for clarification
16. If approved:
    → Status: 'payment_verified'
17. ✨ Customer receives confirmation email

┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: ADMIN SCHEDULING                                   │
└─────────────────────────────────────────────────────────────┘
18. Admin schedules pickup:
    - Checks capacity calendar
    - Sets pickup date & time
    - Adds baker notes
    → Status: 'scheduled'
19. ✨ Customer receives schedule confirmation:
    - Pickup date & time
    - Location & instructions
    - Contact number
20. ✨ System sends reminder 1 day before pickup

┌─────────────────────────────────────────────────────────────┐
│ PHASE 6: PRODUCTION & PICKUP                                │
└─────────────────────────────────────────────────────────────┘
21. Baker updates status as production progresses:
    - 'in_production' - Being made
    - 'ready_for_pickup' - Ready
22. Customer arrives for pickup
23. Staff marks as picked up
    → Status: 'completed'
24. ✨ Optional: Customer receives feedback request

┌─────────────────────────────────────────────────────────────┐
│ ALTERNATE PATHS                                             │
└─────────────────────────────────────────────────────────────┘
- Admin can REJECT during review → Status: 'rejected'
- Customer can CANCEL before production → Status: 'cancelled'
- Admin can REQUEST CHANGES → Customer can revise design
```

---

## 🗄️ Database Schema Changes

### 1. Update `custom_cake_request` Table

```sql
ALTER TABLE custom_cake_request
  -- Update status enum with new statuses
  MODIFY status ENUM(
    'draft',                           -- Initial design phase
    'pending_review',                  -- Submitted, waiting for admin
    'quoted',                          -- Admin set price, waiting for payment
    'payment_pending_verification',    -- Receipt uploaded, needs verification
    'payment_verified',                -- Payment confirmed by admin
    'scheduled',                       -- Pickup date set
    'in_production',                   -- Being made by baker
    'ready_for_pickup',                -- Ready for customer
    'completed',                       -- Customer picked up
    'cancelled',                       -- Cancelled by customer/admin
    'rejected',                        -- Admin rejected design
    'revision_requested'               -- Admin requested design changes
  ) DEFAULT 'draft',

  -- Quote Phase Fields
  ADD COLUMN quoted_price DECIMAL(10,2) NULL
    COMMENT 'Custom price set by admin after review',
  ADD COLUMN quote_notes TEXT NULL
    COMMENT 'Admin notes explaining the quote',
  ADD COLUMN quote_breakdown JSON NULL
    COMMENT 'Detailed price breakdown {base, layers, decorations, complexity}',
  ADD COLUMN quoted_at TIMESTAMP NULL
    COMMENT 'When admin sent the quote',
  ADD COLUMN quoted_by INT NULL
    COMMENT 'Admin who created the quote',

  -- Payment Phase Fields
  ADD COLUMN payment_method VARCHAR(50) NULL
    COMMENT 'How customer will pay: gcash, bank_transfer, etc',
  ADD COLUMN payment_reference VARCHAR(100) NULL
    COMMENT 'Reference number from payment',
  ADD COLUMN payment_receipt_url VARCHAR(500) NULL
    COMMENT 'Main receipt image URL',
  ADD COLUMN payment_amount DECIMAL(10,2) NULL
    COMMENT 'Amount customer claims to have paid',
  ADD COLUMN payment_uploaded_at TIMESTAMP NULL
    COMMENT 'When customer uploaded receipt',

  -- Payment Verification Fields
  ADD COLUMN payment_verified BOOLEAN DEFAULT FALSE
    COMMENT 'Whether admin verified the payment',
  ADD COLUMN payment_verified_at TIMESTAMP NULL
    COMMENT 'When payment was verified',
  ADD COLUMN payment_verified_by INT NULL
    COMMENT 'Admin who verified payment',
  ADD COLUMN payment_verification_notes TEXT NULL
    COMMENT 'Admin notes about payment verification',

  -- Revision Fields
  ADD COLUMN revision_count INT DEFAULT 0
    COMMENT 'How many times design was revised',
  ADD COLUMN revision_notes TEXT NULL
    COMMENT 'Admin notes requesting changes',
  ADD COLUMN last_revised_at TIMESTAMP NULL,

  -- Tracking & Communication
  ADD COLUMN tracking_code VARCHAR(50) UNIQUE NULL
    COMMENT 'Customer-friendly tracking code (e.g., CAKE-2024-001)',
  ADD COLUMN customer_notes TEXT NULL
    COMMENT 'Customer notes during payment/updates',
  ADD COLUMN internal_notes TEXT NULL
    COMMENT 'Internal staff communication',

  -- Production Fields
  ADD COLUMN production_started_at TIMESTAMP NULL,
  ADD COLUMN production_completed_at TIMESTAMP NULL,
  ADD COLUMN assigned_baker_id INT NULL
    COMMENT 'Staff assigned to make the cake',

  -- Pickup Fields
  ADD COLUMN actual_pickup_date TIMESTAMP NULL
    COMMENT 'When customer actually picked up',
  ADD COLUMN picked_up_by VARCHAR(100) NULL
    COMMENT 'Name of person who picked up',

  -- Rating & Feedback
  ADD COLUMN customer_rating INT NULL CHECK (customer_rating BETWEEN 1 AND 5),
  ADD COLUMN customer_feedback TEXT NULL,
  ADD COLUMN feedback_submitted_at TIMESTAMP NULL,

  -- Add Foreign Keys
  ADD FOREIGN KEY (quoted_by) REFERENCES admin(admin_id) ON DELETE SET NULL,
  ADD FOREIGN KEY (payment_verified_by) REFERENCES admin(admin_id) ON DELETE SET NULL,
  ADD FOREIGN KEY (assigned_baker_id) REFERENCES staff(staff_id) ON DELETE SET NULL,

  -- Add Indexes
  ADD INDEX idx_tracking_code (tracking_code),
  ADD INDEX idx_payment_status (payment_verified, status),
  ADD INDEX idx_production_status (status, scheduled_pickup_date);
```

### 2. Create New Table: `custom_cake_payment_receipts`

```sql
CREATE TABLE custom_cake_payment_receipts (
  receipt_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,

  -- Receipt Details
  receipt_url VARCHAR(500) NOT NULL COMMENT 'Image/PDF URL',
  receipt_type ENUM('image', 'pdf') DEFAULT 'image',
  file_size INT COMMENT 'File size in bytes',

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
) ENGINE=InnoDB;
```

### 3. Create New Table: `custom_cake_status_history`

```sql
CREATE TABLE custom_cake_status_history (
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
) ENGINE=InnoDB;
```

### 4. Create Trigger for Status History

```sql
DELIMITER //

CREATE TRIGGER tr_custom_cake_status_change
AFTER UPDATE ON custom_cake_request
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO custom_cake_status_history
      (request_id, old_status, new_status, changed_at)
    VALUES
      (NEW.request_id, OLD.status, NEW.status, NOW());
  END IF;
END//

DELIMITER ;
```

### 5. Update Views

```sql
-- Enhanced view for admin dashboard
CREATE OR REPLACE VIEW v_custom_cake_dashboard AS
SELECT
  ccr.*,
  -- Admin names
  qa.username as quoted_by_name,
  va.username as verified_by_name,
  ra.username as reviewed_by_name,
  -- Customer info
  c.customer_tier,
  c.total_spent as customer_lifetime_value,
  -- Production info
  s.name as baker_name,
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
  END as action_required
FROM custom_cake_request ccr
LEFT JOIN admin qa ON ccr.quoted_by = qa.admin_id
LEFT JOIN admin va ON ccr.payment_verified_by = va.admin_id
LEFT JOIN admin ra ON ccr.reviewed_by = ra.admin_id
LEFT JOIN customer c ON ccr.customer_phone = c.phone
LEFT JOIN staff s ON ccr.assigned_baker_id = s.staff_id
WHERE ccr.status != 'completed'
  AND ccr.status != 'cancelled'
  AND ccr.status != 'rejected'
ORDER BY
  FIELD(ccr.status, 'payment_pending_verification', 'pending_review', 'payment_verified', 'scheduled', 'in_production', 'ready_for_pickup'),
  ccr.submitted_at ASC;
```

---

## 📦 TypeScript Interfaces

### Core Types & Enums

```typescript
// ============================================================================
// ENUMS
// ============================================================================

export enum CustomCakeStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  QUOTED = 'quoted',
  PAYMENT_PENDING_VERIFICATION = 'payment_pending_verification',
  PAYMENT_VERIFIED = 'payment_verified',
  SCHEDULED = 'scheduled',
  IN_PRODUCTION = 'in_production',
  READY_FOR_PICKUP = 'ready_for_pickup',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  REVISION_REQUESTED = 'revision_requested',
}

export enum PaymentMethod {
  GCASH = 'gcash',
  BANK_TRANSFER = 'bank_transfer',
  PAYMAYA = 'paymaya',
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
}

export enum PaymentVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_CLARIFICATION = 'needs_clarification',
}

export enum NotificationType {
  SUBMISSION_RECEIVED = 'submission_received',
  QUOTE_READY = 'quote_ready',
  PAYMENT_RECEIPT_UPLOADED = 'payment_receipt_uploaded',
  PAYMENT_VERIFIED = 'payment_verified',
  PAYMENT_REJECTED = 'payment_rejected',
  SCHEDULED = 'scheduled',
  PRODUCTION_STARTED = 'production_started',
  READY_FOR_PICKUP = 'ready_for_pickup',
  PICKUP_REMINDER = 'pickup_reminder',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  REVISION_REQUESTED = 'revision_requested',
}

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface CustomCakeRequest {
  request_id: number;
  session_token: string;
  tracking_code: string;

  // Customer Information
  customer_name: string;
  customer_phone: string;
  customer_email: string;

  // Cake Structure
  num_layers: number;
  layer_1_flavor_id?: number;
  layer_2_flavor_id?: number;
  layer_3_flavor_id?: number;
  layer_4_flavor_id?: number;
  layer_5_flavor_id?: number;
  layer_1_size_id?: number;
  layer_2_size_id?: number;
  layer_3_size_id?: number;
  layer_4_size_id?: number;
  layer_5_size_id?: number;
  total_height_cm?: number;
  base_diameter_cm?: number;

  // Decorations
  theme_id?: number;
  frosting_color?: string;
  frosting_type: string;
  candles_count: number;
  candle_type: string;
  candle_numbers?: string;

  // Text
  cake_text?: string;
  text_color?: string;
  text_font?: string;
  text_position?: string;

  // 3D Decorations
  decorations_3d?: any[];

  // Instructions
  special_instructions?: string;
  dietary_restrictions?: string;
  baker_notes?: string;
  internal_notes?: string;
  customer_notes?: string;

  // Event Details
  event_type?: string;
  event_date?: string;

  // Status & Workflow
  status: CustomCakeStatus;

  // Pricing - Initial
  estimated_price?: number;
  price_breakdown?: PriceBreakdown;

  // Quote Phase
  quoted_price?: number;
  quote_notes?: string;
  quote_breakdown?: PriceBreakdown;
  quoted_at?: string;
  quoted_by?: number;

  // Payment Phase
  payment_method?: PaymentMethod;
  payment_reference?: string;
  payment_receipt_url?: string;
  payment_amount?: number;
  payment_uploaded_at?: string;

  // Payment Verification
  payment_verified: boolean;
  payment_verified_at?: string;
  payment_verified_by?: number;
  payment_verification_notes?: string;

  // Scheduling
  preparation_days?: number;
  scheduled_pickup_date?: string;
  scheduled_pickup_time?: string;

  // Production
  production_started_at?: string;
  production_completed_at?: string;
  assigned_baker_id?: number;

  // Pickup
  actual_pickup_date?: string;
  picked_up_by?: string;

  // Review & Revision
  reviewed_at?: string;
  reviewed_by?: number;
  rejection_reason?: string;
  admin_notes?: string;
  revision_count: number;
  revision_notes?: string;
  last_revised_at?: string;

  // Feedback
  customer_rating?: number;
  customer_feedback?: string;
  feedback_submitted_at?: string;

  // Order Link
  order_id?: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  expires_at?: string;
}

export interface PriceBreakdown {
  base_price: number;
  layers_cost: number;
  decorations_cost: number;
  theme_cost: number;
  complexity_multiplier: number;
  special_requests_cost: number;
  total: number;
  notes?: string;
}

export interface PaymentReceipt {
  receipt_id: number;
  request_id: number;
  receipt_url: string;
  receipt_type: 'image' | 'pdf';
  file_size: number;
  payment_amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  payment_date?: string;
  uploaded_at: string;
  uploaded_by_email?: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: number;
  verification_status: PaymentVerificationStatus;
  verification_notes?: string;
  is_primary: boolean;
  replaced_by?: number;
}

export interface StatusHistoryEntry {
  history_id: number;
  request_id: number;
  old_status?: string;
  new_status: string;
  changed_at: string;
  changed_by?: number;
  changed_by_type: 'customer' | 'admin' | 'cashier' | 'system';
  change_reason?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

// Contact Confirmation (Mobile Editor)
export interface ContactConfirmationData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  confirmed: boolean;
  terms_accepted: boolean;
}

// Admin Quote
export interface CreateQuoteRequest {
  quoted_price: number;
  quote_notes?: string;
  quote_breakdown?: PriceBreakdown;
  preparation_days: number;
}

export interface CreateQuoteResponse {
  success: boolean;
  message: string;
  tracking_code: string;
  quoted_price: number;
}

// Payment Upload
export interface UploadPaymentReceiptRequest {
  tracking_code: string;
  payment_amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  payment_date?: string;
  receipt_file: File | string; // File object or base64
  customer_notes?: string;
}

export interface UploadPaymentReceiptResponse {
  success: boolean;
  message: string;
  receipt_id: number;
  verification_pending: boolean;
}

// Payment Verification
export interface VerifyPaymentRequest {
  request_id: number;
  receipt_id: number;
  approved: boolean;
  verification_notes?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  next_step: 'schedule_pickup' | 'request_reupload';
}

// Scheduling
export interface SchedulePickupRequest {
  request_id: number;
  scheduled_pickup_date: string;
  scheduled_pickup_time: string;
  assigned_baker_id?: number;
  baker_notes?: string;
}

export interface SchedulePickupResponse {
  success: boolean;
  message: string;
  scheduled_pickup_date: string;
  estimated_ready_date: string;
}

// Customer Tracking
export interface TrackingInfo {
  tracking_code: string;
  request: CustomCakeRequest;
  current_status: CustomCakeStatus;
  status_history: StatusHistoryEntry[];
  timeline: TimelineEvent[];
  can_upload_receipt: boolean;
  can_cancel: boolean;
  estimated_completion?: string;
}

export interface TimelineEvent {
  event_type: string;
  event_name: string;
  event_description: string;
  timestamp?: string;
  is_completed: boolean;
  is_current: boolean;
  icon: string;
}

// Admin Dashboard
export interface AdminDashboardStats {
  pending_review: number;
  pending_payment_verification: number;
  needs_scheduling: number;
  in_production: number;
  ready_for_pickup: number;
  total_revenue_pending: number;
  total_revenue_verified: number;
  avg_review_time_hours: number;
  avg_verification_time_hours: number;
}

export interface CustomCakeRequestWithDetails extends CustomCakeRequest {
  layers: Array<{
    layer_number: number;
    flavor_name?: string;
    size_name?: string;
    diameter_cm?: number;
  }>;
  images: Array<{
    image_id: number;
    image_url: string;
    image_type: string;
    view_angle: string;
    uploaded_at: string;
  }>;
  receipts: PaymentReceipt[];
  status_history: StatusHistoryEntry[];
  quoted_by_name?: string;
  verified_by_name?: string;
  reviewed_by_name?: string;
  baker_name?: string;
  days_until_pickup?: number;
  action_required?: string;
}

// ============================================================================
// VALIDATION SCHEMAS (for runtime validation)
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Helper functions
export const validateContactInfo = (data: ContactConfirmationData): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.customer_name || data.customer_name.trim().length < 2) {
    errors.push({ field: 'customer_name', message: 'Name must be at least 2 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.customer_email || !emailRegex.test(data.customer_email)) {
    errors.push({ field: 'customer_email', message: 'Please enter a valid email address' });
  }

  const phoneRegex = /^(\+63|0)?9\d{9}$/;
  if (!data.customer_phone || !phoneRegex.test(data.customer_phone.replace(/[-\s]/g, ''))) {
    errors.push({ field: 'customer_phone', message: 'Please enter a valid Philippine phone number' });
  }

  if (!data.confirmed) {
    errors.push({ field: 'confirmed', message: 'Please confirm your contact details' });
  }

  if (!data.terms_accepted) {
    errors.push({ field: 'terms_accepted', message: 'Please accept the terms and conditions' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validatePaymentReceipt = (data: UploadPaymentReceiptRequest): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.payment_amount || data.payment_amount <= 0) {
    errors.push({ field: 'payment_amount', message: 'Payment amount must be greater than 0' });
  }

  if (!data.payment_method) {
    errors.push({ field: 'payment_method', message: 'Please select payment method' });
  }

  if (!data.receipt_file) {
    errors.push({ field: 'receipt_file', message: 'Please upload a receipt image' });
  }

  if (!data.tracking_code) {
    errors.push({ field: 'tracking_code', message: 'Tracking code is required' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// API CLIENT TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 🔌 API Endpoints

### Customer Endpoints (Mobile Editor & Tracking)

```typescript
// Submit design (with contact confirmation)
POST /api/custom-cake/submit-with-confirmation
Body: {
  session_token: string;
  design_data: CustomCakeRequest;
  contact_confirmation: ContactConfirmationData;
}
Response: ApiResponse<{ request_id: number, tracking_code: string }>

// Get tracking info
GET /api/custom-cake/track/:trackingCode
Response: ApiResponse<TrackingInfo>

// Upload payment receipt
POST /api/custom-cake/payment/upload-receipt
Body: UploadPaymentReceiptRequest
Response: ApiResponse<UploadPaymentReceiptResponse>

// Cancel request
POST /api/custom-cake/:trackingCode/cancel
Body: { cancellation_reason: string }
Response: ApiResponse<void>

// Submit feedback
POST /api/custom-cake/:trackingCode/feedback
Body: { rating: number, feedback: string }
Response: ApiResponse<void>
```

### Admin Endpoints

```typescript
// Dashboard Stats
GET /api/admin/custom-cakes/dashboard-stats
Response: ApiResponse<AdminDashboardStats>

// List by status
GET /api/admin/custom-cakes/by-status/:status
Query: { page?, limit?, sort? }
Response: PaginatedResponse<CustomCakeRequestWithDetails[]>

// Get request details
GET /api/admin/custom-cakes/:requestId/details
Response: ApiResponse<CustomCakeRequestWithDetails>

// Create & Send Quote
POST /api/admin/custom-cakes/:requestId/create-quote
Body: CreateQuoteRequest
Response: ApiResponse<CreateQuoteResponse>

// View payment receipts
GET /api/admin/custom-cakes/:requestId/receipts
Response: ApiResponse<PaymentReceipt[]>

// Verify payment
POST /api/admin/custom-cakes/:requestId/verify-payment
Body: VerifyPaymentRequest
Response: ApiResponse<VerifyPaymentResponse>

// Request receipt reupload
POST /api/admin/custom-cakes/:requestId/request-receipt-reupload
Body: { reason: string, instructions: string }
Response: ApiResponse<void>

// Schedule pickup
POST /api/admin/custom-cakes/:requestId/schedule-pickup
Body: SchedulePickupRequest
Response: ApiResponse<SchedulePickupResponse>

// Update production status
POST /api/admin/custom-cakes/:requestId/update-status
Body: { status: CustomCakeStatus, notes?: string }
Response: ApiResponse<void>

// Request design revision
POST /api/admin/custom-cakes/:requestId/request-revision
Body: { revision_notes: string, specific_changes: string[] }
Response: ApiResponse<void>

// Reject request
POST /api/admin/custom-cakes/:requestId/reject
Body: { rejection_reason: string, admin_notes?: string }
Response: ApiResponse<void>

// Assign baker
POST /api/admin/custom-cakes/:requestId/assign-baker
Body: { baker_id: number }
Response: ApiResponse<void>
```

---

## 🎨 Frontend Components

### 1. Mobile Editor - Contact Confirmation Modal

**File:** `client/MobileEditor/components/ContactConfirmationModal.tsx`

```typescript
interface Props {
  isOpen: boolean;
  contactInfo: ContactConfirmationData;
  onConfirm: (data: ContactConfirmationData) => void;
  onCancel: () => void;
  onEdit: () => void;
}

Features:
- Display contact details prominently
- Edit button to go back and modify
- Terms & conditions checkbox
- Confirmation checkbox "I verify this information is correct"
- Warning: "We will contact you at these details only"
- Validation before allowing confirm
```

### 2. Customer Tracking Portal

**File:** `client/MobileEditor/app/track/[trackingCode]/page.tsx`

```typescript
Features:
- Timeline showing all status updates
- Current status with icon & description
- Estimated completion date
- Payment upload section (when status = quoted)
- Receipt upload history
- Contact information
- Order details summary
- Cancel button (if applicable)
- Feedback form (after completion)
```

### 3. Payment Receipt Upload

**File:** `client/MobileEditor/components/PaymentReceiptUpload.tsx`

```typescript
Features:
- Drag & drop file upload
- Image preview
- Payment details form
- Support image compression
- Show quote amount for reference
- Payment instructions
- Receipt upload history
- Status: Pending/Verified/Rejected
```

### 4. Admin Quote Creation Interface

**File:** `client/cashieradmin/components/QuoteCreator.tsx`

```typescript
Features:
- Complete request details view
- 3D render gallery
- Price calculator helper
- Suggested price based on complexity
- Manual price override
- Price breakdown builder
- Quote notes (visible to customer)
- Preparation time estimator
- Capacity checker for dates
- Send quote preview
```

### 5. Admin Payment Verification Interface

**File:** `client/cashieradmin/components/PaymentVerification.tsx`

```typescript
Features:
- Receipt image viewer (zoom, rotate)
- Side-by-side: Receipt vs Expected
- Payment details comparison
- Approve/Reject buttons
- Request clarification button
- Verification notes field
- History of all receipts uploaded
- Quick actions
```

### 6. Admin Scheduling Interface

**File:** `client/cashieradmin/components/PickupScheduler.tsx`

```typescript
Features:
- Calendar view with capacity
- Time slot selection
- Baker assignment dropdown
- Production timeline calculator
- Baker notes field
- Conflict checker
- Confirmation with email preview
```

### 7. Admin Dashboard Enhanced

**File:** `client/cashieradmin/app/admin/custom-cakes/dashboard.tsx`

```typescript
Features:
- Status cards with counts
- Urgent actions section
- Payment verification queue
- Review queue
- Production timeline
- Revenue metrics
- Performance metrics (avg review time, etc)
- Quick filters by status
- Search by tracking code/customer
```

---

## ✨ Features & Enhancements

### 1. Email Notifications System

```typescript
Notifications to implement:
✅ submission_received → Admin
✅ quote_ready → Customer
✅ payment_receipt_uploaded → Admin
✅ payment_verified → Customer
✅ payment_rejected → Customer (with instructions)
✅ scheduled → Customer (with pickup details)
✅ production_started → Customer (optional)
✅ ready_for_pickup → Customer
✅ pickup_reminder → Customer (1 day before)
✅ cancelled → Customer & Admin
✅ rejected → Customer
✅ revision_requested → Customer
```

### 2. Price Calculator Helper

```typescript
Function: calculateSuggestedPrice(request: CustomCakeRequest): PriceBreakdown

Factors:
- Base price: ₱500
- Per layer: ₱150-300 (based on size)
- Frosting type: Buttercream (+0), Fondant (+300), Ganache (+200)
- Theme: ₱200-500
- Complexity multiplier:
  - Simple (1-2 layers, minimal text): 1.0x
  - Medium (3 layers, decorations): 1.2x
  - Complex (4+ layers, custom text, 3D): 1.5x
  - Intricate (5 layers, extensive decorations): 2.0x
- Special requests: +₱100-500
- Rush order (< 3 days): +20%
```

### 3. Capacity Management

```typescript
Features:
- Max 10 custom cakes per day
- Check capacity when scheduling
- Visual calendar with availability
- Suggest alternative dates if full
- Reserve slot on verification
- Release slot on cancellation
```

### 4. Customer Order Tracking Page

```typescript
URL: /track/:trackingCode

Features:
- No login required (tracking code is secret)
- Timeline visualization
- Status updates
- Upload receipt section
- Download quote PDF
- Contact support button
- Cancel request (before production)
- View all communications
```

### 5. Image Upload & Processing

```typescript
Features:
- Support: JPG, PNG, PDF
- Client-side image compression
- Max size: 5MB
- Preview before upload
- Crop/rotate tools (optional)
- Progress indicator
- Multiple uploads supported
- Generate thumbnails
```

### 6. Automatic Status Transitions

```typescript
System automatically:
- Expires sessions after 2 hours
- Sends reminders 1 day before pickup
- Marks overdue pickups
- Archives completed orders after 30 days
- Releases capacity on cancellation
```

### 7. Admin Internal Notes System

```typescript
Features:
- Private notes not visible to customer
- Note categories: general, production, quality, customer
- @ mentions for team communication
- Timestamp & author tracking
- Edit history
```

### 8. Design Revision Flow

```typescript
If admin requests changes:
1. Admin specifies what needs changing
2. Status → revision_requested
3. Customer receives notification with details
4. Customer can revise design (reopens editor)
5. Customer resubmits
6. Status → pending_review
7. Revision count increments
```

### 9. Cancellation Policy

```typescript
Rules:
- Can cancel before payment verification: Full refund
- Can cancel after payment, before production: 80% refund
- Can cancel during production: 50% refund
- Cannot cancel if ready/completed

Admin can cancel anytime with custom refund amount
```

### 10. Rating & Feedback System

```typescript
After pickup (status = completed):
- Send feedback request email after 1 day
- Simple 5-star rating
- Optional text feedback
- Display avg rating in admin dashboard
- Use for quality metrics
```

---

## 📋 Implementation Checklist

### Phase 1: Database & Backend (Week 1)

- [ ] Run database migration scripts
  - [ ] Alter custom_cake_request table
  - [ ] Create payment_receipts table
  - [ ] Create status_history table
  - [ ] Create triggers
  - [ ] Update views
- [ ] Create TypeScript interfaces file
- [ ] Implement new API endpoints
  - [ ] Contact confirmation
  - [ ] Quote creation
  - [ ] Payment receipt upload
  - [ ] Payment verification
  - [ ] Scheduling
  - [ ] Tracking
- [ ] Add validation middleware
- [ ] Update existing controllers
- [ ] Add notification service methods
- [ ] Test all endpoints

### Phase 2: Mobile Editor (Week 2)

- [ ] Create ContactConfirmationModal component
- [ ] Update submission flow with confirmation
- [ ] Create customer tracking portal
  - [ ] Tracking page component
  - [ ] Timeline component
  - [ ] Status display
- [ ] Create payment upload interface
  - [ ] File upload component
  - [ ] Payment form
  - [ ] Receipt history
- [ ] Add validation and error handling
- [ ] Test mobile responsiveness
- [ ] Add loading states
- [ ] Test complete customer journey

### Phase 3: Admin Interface (Week 3)

- [ ] Update admin dashboard with new stats
- [ ] Create quote creation interface
  - [ ] Price calculator helper
  - [ ] Quote form
  - [ ] Preview
- [ ] Create payment verification interface
  - [ ] Receipt viewer
  - [ ] Comparison view
  - [ ] Verification form
- [ ] Create scheduling interface
  - [ ] Calendar component
  - [ ] Capacity checker
  - [ ] Baker assignment
- [ ] Update request details view
- [ ] Add status update controls
- [ ] Add internal notes system
- [ ] Test admin workflows

### Phase 4: Notifications & Automation (Week 4)

- [ ] Implement all email templates
- [ ] Add email sending for each status change
- [ ] Create automatic reminder system
- [ ] Add SMS notifications (optional)
- [ ] Test notification delivery
- [ ] Add notification preferences
- [ ] Create notification history log

### Phase 5: Testing & Polish (Week 5)

- [ ] End-to-end testing of complete flow
- [ ] Load testing
- [ ] Security audit
- [ ] UI/UX improvements
- [ ] Add error boundaries
- [ ] Add analytics tracking
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] User guide creation

### Phase 6: Deployment (Week 6)

- [ ] Database backup
- [ ] Run migrations on production
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Monitor for errors
- [ ] User acceptance testing
- [ ] Gather feedback
- [ ] Address issues

---

## 🎯 Success Metrics

### Key Performance Indicators

1. **Admin Efficiency:**
   - Time to review: < 2 hours
   - Time to verify payment: < 30 minutes
   - Orders per day capacity: 10

2. **Customer Satisfaction:**
   - Clear status visibility
   - Easy payment upload
   - Timely notifications
   - Average rating: > 4.5/5

3. **Operational:**
   - Reduced manual errors
   - Complete audit trail
   - Faster order processing
   - Better capacity management

4. **Financial:**
   - Reduced payment disputes
   - Clear pricing transparency
   - Better revenue tracking
   - Reduced cancellations

---

## 🔒 Security Considerations

1. **Payment Receipt Security:**
   - Store receipts securely
   - Encrypt sensitive payment data
   - Access control for admin only
   - Audit log all access

2. **Customer Data Protection:**
   - Validate email/phone before storage
   - GDPR compliance considerations
   - Secure tracking codes (not guessable)
   - Rate limiting on tracking lookups

3. **File Upload Security:**
   - Validate file types
   - Scan for malware
   - Size limits
   - Prevent path traversal

4. **Authentication:**
   - Admin endpoints require auth
   - Customer endpoints use tracking codes
   - Session timeout
   - CSRF protection

---

## 📚 Documentation

### For Customers:
- How to design custom cake
- How to confirm contact details
- How to upload payment receipt
- How to track order
- How to cancel order
- FAQ

### For Admin:
- How to review requests
- How to create quotes
- How to verify payments
- How to schedule pickups
- How to manage production
- Troubleshooting guide

### For Developers:
- API documentation
- Database schema
- TypeScript interfaces
- Component documentation
- Testing guide
- Deployment guide

---

**END OF COMPREHENSIVE PLAN**
