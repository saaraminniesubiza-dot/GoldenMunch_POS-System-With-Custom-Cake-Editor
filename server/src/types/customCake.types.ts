/**
 * Custom Cake System - TypeScript Type Definitions
 * Shared types for frontend and backend
 */

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
  NEEDS_CLARIFICATION = 'needs_clarification',
}

export enum ChangedByType {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  CASHIER = 'cashier',
  SYSTEM = 'system',
}

// ============================================================================
// BASE INTERFACES
// ============================================================================

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

export interface PaymentReceipt {
  receipt_id: number;
  request_id: number;
  receipt_url: string;
  receipt_type: 'image' | 'pdf';
  file_size: number;
  original_filename?: string;
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
  changed_by_type: ChangedByType;
  change_reason?: string;
  metadata?: Record<string, any>;
}

export interface CakeLayer {
  layer_number: number;
  flavor_name?: string;
  size_name?: string;
  diameter_cm?: number;
}

export interface CakeImage {
  image_id: number;
  image_url: string;
  image_type: string;
  view_angle: string;
  uploaded_at: string;
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

// Submit with Confirmation
export interface SubmitWithConfirmationRequest {
  session_token: string;
  design_data: Partial<CustomCakeRequest>;
  contact_confirmation: ContactConfirmationData;
}

export interface SubmitWithConfirmationResponse {
  success: boolean;
  message: string;
  data: {
    request_id: number;
    tracking_code: string;
  };
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
  receipt_file: string; // base64
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

// Update Status
export interface UpdateStatusRequest {
  request_id: number;
  new_status: CustomCakeStatus;
  notes?: string;
  metadata?: Record<string, any>;
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
  layers: CakeLayer[];
  images: CakeImage[];
  receipts: PaymentReceipt[];
  status_history: StatusHistoryEntry[];
  quoted_by_name?: string;
  verified_by_name?: string;
  reviewed_by_name?: string;
  baker_name?: string;
  days_until_pickup?: number;
  action_required?: string;
  customer_lifetime_value?: number;
  customer_tier?: string;
  receipt_count?: number;
  latest_receipt_status?: PaymentVerificationStatus;
}

// Cancellation
export interface CancelRequestRequest {
  tracking_code: string;
  cancellation_reason: string;
}

// Feedback
export interface SubmitFeedbackRequest {
  tracking_code: string;
  rating: number; // 1-5
  feedback?: string;
}

// Revision Request
export interface RequestRevisionRequest {
  request_id: number;
  revision_notes: string;
  specific_changes: string[];
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// API RESPONSE WRAPPER
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

// ============================================================================
// DATABASE ROW TYPES (for backend)
// ============================================================================

export interface CustomCakeRequestRow extends Omit<CustomCakeRequest, 'decorations_3d' | 'price_breakdown' | 'quote_breakdown'> {
  decorations_3d?: string; // JSON string in DB
  price_breakdown?: string; // JSON string in DB
  quote_breakdown?: string; // JSON string in DB
}

export interface PaymentReceiptRow extends PaymentReceipt {}

export interface StatusHistoryRow extends Omit<StatusHistoryEntry, 'metadata'> {
  metadata?: string; // JSON string in DB
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type CustomCakeStatusKeys = keyof typeof CustomCakeStatus;
export type PaymentMethodKeys = keyof typeof PaymentMethod;
export type PaymentVerificationStatusKeys = keyof typeof PaymentVerificationStatus;

// For partial updates
export type PartialCustomCakeRequest = Partial<CustomCakeRequest>;

// For creating new requests
export type NewCustomCakeRequest = Omit<CustomCakeRequest,
  'request_id' | 'tracking_code' | 'created_at' | 'updated_at' | 'payment_verified' | 'revision_count'
>;
