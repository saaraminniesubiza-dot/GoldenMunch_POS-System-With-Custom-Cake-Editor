/**
 * Enhanced Custom Cake Controller
 * New endpoints for improved workflow with payment verification
 */

import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query, transaction } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getInsertId } from '../utils/typeGuards';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { emailService } from '../services/email.service';
import { capacityService } from '../services/capacity.service';
import logger from '../utils/logger';

// Import enhanced types
import {
  CustomCakeStatus,
  PaymentMethod,
  PaymentVerificationStatus,
  ContactConfirmationData,
  SubmitWithConfirmationRequest,
  CreateQuoteRequest,
  UploadPaymentReceiptRequest,
  VerifyPaymentRequest,
  SchedulePickupRequest,
  UpdateStatusRequest,
  CancelRequestRequest,
  SubmitFeedbackRequest,
  RequestRevisionRequest,
  CustomCakeRequest as CustomCakeRequestType,
  PaymentReceipt,
  CustomCakeRequestRow,
  PaymentReceiptRow,
} from '../types/customCake.types';

// Import validation utilities
import {
  validateContactInfo,
  validatePaymentReceipt,
  validateQuoteData,
  validateSchedulePickup,
  validateFeedback,
  validateDesignData,
  formatPhilippinePhone,
  checkPaymentMatch,
} from '../utils/customCakeValidation';

// Import pricing utilities
import {
  calculateSuggestedPrice,
  calculatePreparationDays,
  formatPrice,
} from '../utils/customCakePricing';

// ============================================================================
// CUSTOMER ENDPOINTS
// ============================================================================

/**
 * Submit custom cake design with contact confirmation
 * POST /api/custom-cake/submit-with-confirmation
 */
export const submitWithConfirmation = async (req: AuthRequest, res: Response) => {
  const { session_token, design_data, contact_confirmation }: SubmitWithConfirmationRequest = req.body;

  logger.info('📝 Submitting custom cake with confirmation', {
    session_token: session_token?.substring(0, 20) + '...',
  });

  // Validate contact confirmation
  const contactValidation = validateContactInfo(contact_confirmation);
  if (!contactValidation.valid) {
    throw new AppError('Contact confirmation validation failed', 400, contactValidation.errors);
  }

  // Validate design data
  const designValidation = validateDesignData(design_data);
  if (!designValidation.valid) {
    throw new AppError('Design data validation failed', 400, designValidation.errors);
  }

  // Validate session
  const sessions = await query<any[]>(
    `SELECT * FROM qr_code_sessions WHERE session_token = ? AND status = 'active' AND expires_at > NOW()`,
    [session_token]
  );

  const session = getFirstRow(sessions);
  if (!session) {
    throw new AppError('Invalid or expired session', 404);
  }

  const result = await transaction(async (conn: mysql.PoolConnection) => {
    // Format phone number
    const formattedPhone = formatPhilippinePhone(contact_confirmation.customer_phone);

    // Calculate estimated price
    const priceBreakdown = calculateSuggestedPrice(design_data);

    // Generate tracking code
    const year = new Date().getFullYear();
    const randomPart = crypto.randomBytes(3).toString('hex');
    const tracking_code = `CAKE-${year}-${randomPart.toUpperCase()}`;

    // Insert request
    const insertResult = await conn.query(
      `INSERT INTO custom_cake_request
       (session_token, tracking_code, customer_name, customer_phone, customer_email,
        num_layers, layer_1_flavor_id, layer_2_flavor_id, layer_3_flavor_id, layer_4_flavor_id, layer_5_flavor_id,
        layer_1_size_id, layer_2_size_id, layer_3_size_id, layer_4_size_id, layer_5_size_id,
        total_height_cm, base_diameter_cm, theme_id, frosting_color, frosting_type,
        candles_count, candle_type, candle_numbers, cake_text, text_color, text_font, text_position,
        decorations_3d, special_instructions, dietary_restrictions, event_type, event_date,
        estimated_price, price_breakdown, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        session_token,
        tracking_code,
        contact_confirmation.customer_name,
        formattedPhone,
        contact_confirmation.customer_email,
        design_data.num_layers,
        design_data.layer_1_flavor_id || null,
        design_data.layer_2_flavor_id || null,
        design_data.layer_3_flavor_id || null,
        design_data.layer_4_flavor_id || null,
        design_data.layer_5_flavor_id || null,
        design_data.layer_1_size_id || null,
        design_data.layer_2_size_id || null,
        design_data.layer_3_size_id || null,
        design_data.layer_4_size_id || null,
        design_data.layer_5_size_id || null,
        design_data.total_height_cm || null,
        design_data.base_diameter_cm || null,
        design_data.theme_id || null,
        design_data.frosting_color || null,
        design_data.frosting_type || 'buttercream',
        design_data.candles_count || 0,
        design_data.candle_type || 'regular',
        design_data.candle_numbers || null,
        design_data.cake_text || null,
        design_data.text_color || null,
        design_data.text_font || 'script',
        design_data.text_position || 'top',
        design_data.decorations_3d ? JSON.stringify(design_data.decorations_3d) : null,
        design_data.special_instructions || null,
        design_data.dietary_restrictions || null,
        design_data.event_type || null,
        design_data.event_date || null,
        priceBreakdown.total,
        JSON.stringify(priceBreakdown),
        CustomCakeStatus.PENDING_REVIEW,
      ]
    );

    const request_id = getInsertId(insertResult);

    // Create notification for admin
    await conn.query(
      `INSERT INTO custom_cake_notifications
       (request_id, notification_type, recipient_email, subject, message_body, status)
       VALUES (?, 'submission_received', ?, ?, ?, 'pending')`,
      [
        request_id,
        process.env.ADMIN_EMAIL || 'admin@goldenmunch.com',
        '🎂 New Custom Cake Request',
        `New custom cake request from ${contact_confirmation.customer_name}. Tracking: ${tracking_code}`,
      ]
    );

    // Mark session as used
    await conn.query(
      `UPDATE qr_code_sessions SET status = 'used', used_at = NOW() WHERE session_token = ?`,
      [session_token]
    );

    return { request_id, tracking_code };
  });

  // Send admin notification email (async)
  emailService.sendCustomCakeNotification(result.request_id, 'submission_received').catch((error) => {
    logger.error('Failed to send admin notification:', error);
  });

  logger.info('✅ Custom cake submitted successfully', { tracking_code: result.tracking_code });

  res.json(
    successResponse('Custom cake request submitted successfully', {
      request_id: result.request_id,
      tracking_code: result.tracking_code,
    })
  );
};

/**
 * Get tracking information for customer
 * GET /api/custom-cake/track/:trackingCode
 */
export const getTrackingInfo = async (req: AuthRequest, res: Response) => {
  const { trackingCode } = req.params;

  logger.info('🔍 Fetching tracking info', { trackingCode });

  // Get request details
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request WHERE tracking_code = ?`,
    [trackingCode]
  );

  const request = getFirstRow<CustomCakeRequestRow>(requests);
  if (!request) {
    throw new AppError('Invalid tracking code', 404);
  }

  // Get status history
  const statusHistory = await query<any[]>(
    `SELECT * FROM custom_cake_status_history WHERE request_id = ? ORDER BY changed_at ASC`,
    [request.request_id]
  );

  // Get payment receipts
  const receipts = await query<any[]>(
    `SELECT * FROM custom_cake_payment_receipts WHERE request_id = ? ORDER BY uploaded_at DESC`,
    [request.request_id]
  );

  // Build timeline
  const timeline = buildTimeline(request, statusHistory);

  // Determine what customer can do
  const can_upload_receipt = request.status === CustomCakeStatus.QUOTED;
  const can_cancel = [
    CustomCakeStatus.PENDING_REVIEW,
    CustomCakeStatus.QUOTED,
    CustomCakeStatus.PAYMENT_PENDING_VERIFICATION,
  ].includes(request.status as CustomCakeStatus);

  // Parse JSON fields
  if (request.decorations_3d && typeof request.decorations_3d === 'string') {
    request.decorations_3d = JSON.parse(request.decorations_3d);
  }
  if (request.price_breakdown && typeof request.price_breakdown === 'string') {
    request.price_breakdown = JSON.parse(request.price_breakdown);
  }
  if (request.quote_breakdown && typeof request.quote_breakdown === 'string') {
    request.quote_breakdown = JSON.parse(request.quote_breakdown);
  }

  res.json(
    successResponse('Tracking information retrieved', {
      tracking_code: trackingCode,
      request,
      current_status: request.status,
      status_history: statusHistory,
      receipts,
      timeline,
      can_upload_receipt,
      can_cancel,
    })
  );
};

/**
 * Upload payment receipt
 * POST /api/custom-cake/payment/upload-receipt
 */
export const uploadPaymentReceipt = async (req: AuthRequest, res: Response) => {
  const data: UploadPaymentReceiptRequest = req.body;

  logger.info('💳 Uploading payment receipt', { tracking_code: data.tracking_code });

  // Validate
  const validation = validatePaymentReceipt(data);
  if (!validation.valid) {
    throw new AppError('Payment receipt validation failed', 400, validation.errors);
  }

  // Get request
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request WHERE tracking_code = ?`,
    [data.tracking_code]
  );

  const request = getFirstRow<CustomCakeRequestRow>(requests);
  if (!request) {
    throw new AppError('Invalid tracking code', 404);
  }

  // Check status
  if (request.status !== CustomCakeStatus.QUOTED) {
    throw new AppError('Payment receipt can only be uploaded when status is "quoted"', 400);
  }

  const result = await transaction(async (conn: mysql.PoolConnection) => {
    // Mark previous receipts as not primary
    await conn.query(
      `UPDATE custom_cake_payment_receipts SET is_primary = FALSE WHERE request_id = ?`,
      [request.request_id]
    );

    // Insert receipt
    const receiptInsert = await conn.query(
      `INSERT INTO custom_cake_payment_receipts
       (request_id, receipt_url, receipt_type, payment_amount, payment_method, payment_reference,
        payment_date, uploaded_by_email, verification_status, is_primary, file_size)
       VALUES (?, ?, 'image', ?, ?, ?, ?, ?, 'pending', TRUE, ?)`,
      [
        request.request_id,
        data.receipt_file, // base64 or URL
        data.payment_amount,
        data.payment_method,
        data.payment_reference || null,
        data.payment_date || null,
        request.customer_email,
        data.receipt_file.length,
      ]
    );

    const receipt_id = getInsertId(receiptInsert);

    // Update request
    await conn.query(
      `UPDATE custom_cake_request
       SET payment_amount = ?,
           payment_method = ?,
           payment_reference = ?,
           payment_receipt_url = ?,
           payment_uploaded_at = NOW(),
           customer_notes = ?,
           status = ?
       WHERE request_id = ?`,
      [
        data.payment_amount,
        data.payment_method,
        data.payment_reference || null,
        data.receipt_file,
        data.customer_notes || null,
        CustomCakeStatus.PAYMENT_PENDING_VERIFICATION,
        request.request_id,
      ]
    );

    // Create notification for admin
    await conn.query(
      `INSERT INTO custom_cake_notifications
       (request_id, notification_type, recipient_email, subject, message_body, status)
       VALUES (?, 'payment_receipt_uploaded', ?, ?, ?, 'pending')`,
      [
        request.request_id,
        process.env.ADMIN_EMAIL || 'admin@goldenmunch.com',
        '💰 Payment Receipt Uploaded',
        `Payment receipt uploaded for ${request.customer_name}. Tracking: ${request.tracking_code}`,
      ]
    );

    return { receipt_id };
  });

  // Send notification (async)
  emailService.sendCustomCakeNotification(request.request_id, 'payment_receipt_uploaded').catch((error) => {
    logger.error('Failed to send notification:', error);
  });

  logger.info('✅ Payment receipt uploaded', { receipt_id: result.receipt_id });

  res.json(
    successResponse('Payment receipt uploaded successfully', {
      receipt_id: result.receipt_id,
      verification_pending: true,
    })
  );
};

/**
 * Cancel custom cake request
 * POST /api/custom-cake/:trackingCode/cancel
 */
export const cancelRequest = async (req: AuthRequest, res: Response) => {
  const { trackingCode } = req.params;
  const { cancellation_reason }: CancelRequestRequest = req.body;

  logger.info('❌ Cancelling request', { trackingCode });

  if (!cancellation_reason) {
    throw new AppError('Cancellation reason is required', 400);
  }

  // Get request
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request WHERE tracking_code = ?`,
    [trackingCode]
  );

  const request = getFirstRow<CustomCakeRequestRow>(requests);
  if (!request) {
    throw new AppError('Invalid tracking code', 404);
  }

  // Check if cancellation is allowed
  const allowedStatuses = [
    CustomCakeStatus.PENDING_REVIEW,
    CustomCakeStatus.QUOTED,
    CustomCakeStatus.PAYMENT_PENDING_VERIFICATION,
  ];

  if (!allowedStatuses.includes(request.status as CustomCakeStatus)) {
    throw new AppError(
      'Request cannot be cancelled at this stage. Please contact support.',
      400
    );
  }

  await transaction(async (conn: mysql.PoolConnection) => {
    // Update request
    await conn.query(
      `UPDATE custom_cake_request
       SET status = ?,
           customer_notes = CONCAT(COALESCE(customer_notes, ''), '\n\nCancellation reason: ', ?)
       WHERE request_id = ?`,
      [CustomCakeStatus.CANCELLED, cancellation_reason, request.request_id]
    );

    // Create notification
    await conn.query(
      `INSERT INTO custom_cake_notifications
       (request_id, notification_type, recipient_email, subject, message_body, status)
       VALUES (?, 'cancelled', ?, ?, ?, 'pending')`,
      [
        request.request_id,
        process.env.ADMIN_EMAIL || 'admin@goldenmunch.com',
        'Order Cancelled',
        `Customer cancelled order ${request.tracking_code}. Reason: ${cancellation_reason}`,
      ]
    );

    // Release capacity if scheduled
    if (request.scheduled_pickup_date) {
      await capacityService.releaseSlot(request.scheduled_pickup_date);
    }
  });

  logger.info('✅ Request cancelled', { tracking_code: trackingCode });

  res.json(successResponse('Request cancelled successfully'));
};

/**
 * Submit customer feedback
 * POST /api/custom-cake/:trackingCode/feedback
 */
export const submitFeedback = async (req: AuthRequest, res: Response) => {
  const { trackingCode } = req.params;
  const { rating, feedback }: SubmitFeedbackRequest = req.body;

  logger.info('⭐ Submitting feedback', { trackingCode, rating });

  // Validate
  const validation = validateFeedback({ tracking_code: trackingCode, rating, feedback });
  if (!validation.valid) {
    throw new AppError('Feedback validation failed', 400, validation.errors);
  }

  // Get request
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request WHERE tracking_code = ?`,
    [trackingCode]
  );

  const request = getFirstRow<CustomCakeRequestRow>(requests);
  if (!request) {
    throw new AppError('Invalid tracking code', 404);
  }

  // Check if request is completed
  if (request.status !== CustomCakeStatus.COMPLETED) {
    throw new AppError('Feedback can only be submitted for completed orders', 400);
  }

  // Check if feedback already submitted
  if (request.customer_rating) {
    throw new AppError('Feedback already submitted for this order', 400);
  }

  await query(
    `UPDATE custom_cake_request
     SET customer_rating = ?,
         customer_feedback = ?,
         feedback_submitted_at = NOW()
     WHERE request_id = ?`,
    [rating, feedback || null, request.request_id]
  );

  logger.info('✅ Feedback submitted', { request_id: request.request_id, rating });

  res.json(successResponse('Thank you for your feedback!'));
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * Get dashboard statistics
 * GET /api/admin/custom-cakes/dashboard-stats
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  logger.info('📊 Fetching dashboard stats');

  const results = await query<any[]>('CALL sp_get_custom_cake_dashboard_stats()');

  const stats = getFirstRow(results[0]);

  res.json(successResponse('Dashboard stats retrieved', stats));
};

/**
 * Get requests by status
 * GET /api/admin/custom-cakes/by-status/:status
 */
export const getRequestsByStatus = async (req: AuthRequest, res: Response) => {
  const { status } = req.params;
  const { page = 1, limit = 20 } = req.query;

  logger.info('📋 Fetching requests by status', { status });

  const offset = (Number(page) - 1) * Number(limit);

  const requests = await query<any[]>(
    `SELECT * FROM v_custom_cake_dashboard
     WHERE status = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [status, Number(limit), offset]
  );

  const countResult = await query<any[]>(
    `SELECT COUNT(*) as total FROM custom_cake_request WHERE status = ?`,
    [status]
  );

  const total = getFirstRow(countResult).total;

  res.json(
    successResponse('Requests retrieved', {
      requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  );
};

/**
 * Create and send quote
 * POST /api/admin/custom-cakes/:requestId/create-quote
 */
export const createQuote = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const quoteData: CreateQuoteRequest = req.body;
  const admin_id = req.user?.id;

  logger.info('💵 Creating quote', { requestId });

  // Validate
  const validation = validateQuoteData(quoteData);
  if (!validation.valid) {
    throw new AppError('Quote validation failed', 400, validation.errors);
  }

  // Get request
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request WHERE request_id = ?`,
    [requestId]
  );

  const request = getFirstRow<CustomCakeRequestRow>(requests);
  if (!request) {
    throw new AppError('Request not found', 404);
  }

  // Check status
  if (request.status !== CustomCakeStatus.PENDING_REVIEW) {
    throw new AppError('Quote can only be created for requests pending review', 400);
  }

  await transaction(async (conn: mysql.PoolConnection) => {
    // Update request with quote
    await conn.query(
      `UPDATE custom_cake_request
       SET quoted_price = ?,
           quote_notes = ?,
           quote_breakdown = ?,
           preparation_days = ?,
           quoted_at = NOW(),
           quoted_by = ?,
           status = ?
       WHERE request_id = ?`,
      [
        quoteData.quoted_price,
        quoteData.quote_notes || null,
        quoteData.quote_breakdown ? JSON.stringify(quoteData.quote_breakdown) : null,
        quoteData.preparation_days,
        admin_id,
        CustomCakeStatus.QUOTED,
        requestId,
      ]
    );

    // Create notification for customer
    await conn.query(
      `INSERT INTO custom_cake_notifications
       (request_id, notification_type, recipient_email, subject, message_body, status)
       VALUES (?, 'quote_ready', ?, ?, ?, 'pending')`,
      [
        requestId,
        request.customer_email,
        '💰 Your Custom Cake Quote is Ready!',
        `Your quote: ${formatPrice(quoteData.quoted_price)}. Tracking: ${request.tracking_code}`,
      ]
    );
  });

  // Send notification (async)
  emailService.sendCustomCakeNotification(Number(requestId), 'quote_ready').catch((error) => {
    logger.error('Failed to send quote notification:', error);
  });

  logger.info('✅ Quote created', { requestId, quoted_price: quoteData.quoted_price });

  res.json(
    successResponse('Quote created and sent to customer', {
      tracking_code: request.tracking_code,
      quoted_price: quoteData.quoted_price,
    })
  );
};

/**
 * Get payment receipts for request
 * GET /api/admin/custom-cakes/:requestId/receipts
 */
export const getPaymentReceipts = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;

  logger.info('🧾 Fetching payment receipts', { requestId });

  const receipts = await query<any[]>(
    `SELECT ccpr.*, a.username as verified_by_name
     FROM custom_cake_payment_receipts ccpr
     LEFT JOIN admin a ON ccpr.verified_by = a.admin_id
     WHERE ccpr.request_id = ?
     ORDER BY ccpr.uploaded_at DESC`,
    [requestId]
  );

  res.json(successResponse('Payment receipts retrieved', receipts));
};

/**
 * Verify payment
 * POST /api/admin/custom-cakes/:requestId/verify-payment
 */
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const { receipt_id, approved, verification_notes }: VerifyPaymentRequest = req.body;
  const admin_id = req.user?.id;

  logger.info('✅ Verifying payment', { requestId, approved });

  // Get request and receipt
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request WHERE request_id = ?`,
    [requestId]
  );

  const request = getFirstRow<CustomCakeRequestRow>(requests);
  if (!request) {
    throw new AppError('Request not found', 404);
  }

  const receipts = await query<any[]>(
    `SELECT * FROM custom_cake_payment_receipts WHERE receipt_id = ?`,
    [receipt_id]
  );

  const receipt = getFirstRow<PaymentReceiptRow>(receipts);
  if (!receipt) {
    throw new AppError('Receipt not found', 404);
  }

  await transaction(async (conn: mysql.PoolConnection) => {
    if (approved) {
      // Approve payment
      await conn.query(
        `UPDATE custom_cake_payment_receipts
         SET verification_status = 'approved',
             is_verified = TRUE,
             verified_at = NOW(),
             verified_by = ?,
             verification_notes = ?
         WHERE receipt_id = ?`,
        [admin_id, verification_notes || null, receipt_id]
      );

      await conn.query(
        `UPDATE custom_cake_request
         SET payment_verified = TRUE,
             payment_verified_at = NOW(),
             payment_verified_by = ?,
             payment_verification_notes = ?,
             status = ?
         WHERE request_id = ?`,
        [
          admin_id,
          verification_notes || null,
          CustomCakeStatus.PAYMENT_VERIFIED,
          requestId,
        ]
      );

      // Create notification for customer
      await conn.query(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message_body, status)
         VALUES (?, 'payment_verified', ?, ?, ?, 'pending')`,
        [
          requestId,
          request.customer_email,
          '✅ Payment Verified!',
          `Your payment has been verified. We'll schedule your pickup soon. Tracking: ${request.tracking_code}`,
        ]
      );

      // Send notification
      emailService.sendCustomCakeNotification(Number(requestId), 'payment_verified').catch((error) => {
        logger.error('Failed to send verification notification:', error);
      });
    } else {
      // Reject payment
      await conn.query(
        `UPDATE custom_cake_payment_receipts
         SET verification_status = 'rejected',
             verified_at = NOW(),
             verified_by = ?,
             verification_notes = ?
         WHERE receipt_id = ?`,
        [admin_id, verification_notes || 'Payment receipt rejected', receipt_id]
      );

      await conn.query(
        `UPDATE custom_cake_request
         SET status = ?,
             payment_verification_notes = ?
         WHERE request_id = ?`,
        [CustomCakeStatus.QUOTED, verification_notes || null, requestId]
      );

      // Create notification for customer
      await conn.query(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message_body, status)
         VALUES (?, 'payment_rejected', ?, ?, ?, 'pending')`,
        [
          requestId,
          request.customer_email,
          '⚠️ Payment Receipt Issue',
          `Please upload a new payment receipt. Reason: ${verification_notes}. Tracking: ${request.tracking_code}`,
        ]
      );

      // Send notification
      emailService.sendCustomCakeNotification(Number(requestId), 'payment_rejected').catch((error) => {
        logger.error('Failed to send rejection notification:', error);
      });
    }
  });

  logger.info('✅ Payment verification complete', { approved });

  res.json(
    successResponse('Payment verification complete', {
      next_step: approved ? 'schedule_pickup' : 'request_reupload',
    })
  );
};

/**
 * Schedule pickup
 * POST /api/admin/custom-cakes/:requestId/schedule-pickup
 */
export const schedulePickup = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const scheduleData: SchedulePickupRequest = req.body;
  const admin_id = req.user?.id;

  logger.info('📅 Scheduling pickup', { requestId });

  // Validate
  const validation = validateSchedulePickup(scheduleData);
  if (!validation.valid) {
    throw new AppError('Schedule validation failed', 400, validation.errors);
  }

  // Get request
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request WHERE request_id = ?`,
    [requestId]
  );

  const request = getFirstRow<CustomCakeRequestRow>(requests);
  if (!request) {
    throw new AppError('Request not found', 404);
  }

  // Check status
  if (request.status !== CustomCakeStatus.PAYMENT_VERIFIED) {
    throw new AppError('Pickup can only be scheduled for payment-verified requests', 400);
  }

  // Check capacity
  const availability = await capacityService.checkDateAvailability(scheduleData.scheduled_pickup_date);
  if (!availability.available) {
    throw new AppError(
      `Selected date is fully booked (${availability.currentOrders}/${availability.maxOrders} orders). Please choose another date.`,
      400
    );
  }

  await transaction(async (conn: mysql.PoolConnection) => {
    // Update request
    await conn.query(
      `UPDATE custom_cake_request
       SET scheduled_pickup_date = ?,
           scheduled_pickup_time = ?,
           assigned_baker_id = ?,
           baker_notes = ?,
           status = ?
       WHERE request_id = ?`,
      [
        scheduleData.scheduled_pickup_date,
        scheduleData.scheduled_pickup_time,
        scheduleData.assigned_baker_id || null,
        scheduleData.baker_notes || null,
        CustomCakeStatus.SCHEDULED,
        requestId,
      ]
    );

    // Reserve capacity
    await capacityService.reserveSlot(scheduleData.scheduled_pickup_date);

    // Create notification for customer
    await conn.query(
      `INSERT INTO custom_cake_notifications
       (request_id, notification_type, recipient_email, subject, message_body, status)
       VALUES (?, 'scheduled', ?, ?, ?, 'pending')`,
      [
        requestId,
        request.customer_email,
        '🎂 Your Cake is Scheduled!',
        `Pickup: ${scheduleData.scheduled_pickup_date} at ${scheduleData.scheduled_pickup_time}. Tracking: ${request.tracking_code}`,
      ]
    );
  });

  // Send notification
  emailService.sendCustomCakeNotification(Number(requestId), 'scheduled').catch((error) => {
    logger.error('Failed to send schedule notification:', error);
  });

  logger.info('✅ Pickup scheduled', { pickup_date: scheduleData.scheduled_pickup_date });

  // Calculate estimated ready date (preparation days before pickup)
  const pickupDate = new Date(scheduleData.scheduled_pickup_date);
  const prepDays = request.preparation_days || 3;
  const estimatedReady = new Date(pickupDate);
  estimatedReady.setDate(estimatedReady.getDate() - 1); // Ready 1 day before

  res.json(
    successResponse('Pickup scheduled successfully', {
      scheduled_pickup_date: scheduleData.scheduled_pickup_date,
      estimated_ready_date: estimatedReady.toISOString().split('T')[0],
    })
  );
};

/**
 * Update production status
 * POST /api/admin/custom-cakes/:requestId/update-status
 */
export const updateProductionStatus = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const { new_status, notes }: UpdateStatusRequest = req.body;

  logger.info('🔄 Updating status', { requestId, new_status });

  if (!new_status) {
    throw new AppError('New status is required', 400);
  }

  // Get request
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request WHERE request_id = ?`,
    [requestId]
  );

  const request = getFirstRow<CustomCakeRequestRow>(requests);
  if (!request) {
    throw new AppError('Request not found', 404);
  }

  await transaction(async (conn: mysql.PoolConnection) => {
    // Update status
    await conn.query(
      `UPDATE custom_cake_request SET status = ?, internal_notes = ? WHERE request_id = ?`,
      [new_status, notes || null, requestId]
    );

    // If marking as in_production, set production_started_at
    if (new_status === CustomCakeStatus.IN_PRODUCTION) {
      await conn.query(
        `UPDATE custom_cake_request SET production_started_at = NOW() WHERE request_id = ?`,
        [requestId]
      );
    }

    // If marking as ready_for_pickup, set production_completed_at
    if (new_status === CustomCakeStatus.READY_FOR_PICKUP) {
      await conn.query(
        `UPDATE custom_cake_request SET production_completed_at = NOW() WHERE request_id = ?`,
        [requestId]
      );

      // Send notification
      await conn.query(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message_body, status)
         VALUES (?, 'ready_for_pickup', ?, ?, ?, 'pending')`,
        [
          requestId,
          request.customer_email,
          '✅ Your Cake is Ready!',
          `Your custom cake is ready for pickup. Tracking: ${request.tracking_code}`,
        ]
      );

      emailService.sendCustomCakeNotification(Number(requestId), 'ready_for_pickup').catch((error) => {
        logger.error('Failed to send notification:', error);
      });
    }
  });

  logger.info('✅ Status updated', { new_status });

  res.json(successResponse('Status updated successfully'));
};

/**
 * Request design revision
 * POST /api/admin/custom-cakes/:requestId/request-revision
 */
export const requestRevision = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const { revision_notes, specific_changes }: RequestRevisionRequest = req.body;
  const admin_id = req.user?.id;

  logger.info('🔄 Requesting revision', { requestId });

  if (!revision_notes) {
    throw new AppError('Revision notes are required', 400);
  }

  // Get request
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request WHERE request_id = ?`,
    [requestId]
  );

  const request = getFirstRow<CustomCakeRequestRow>(requests);
  if (!request) {
    throw new AppError('Request not found', 404);
  }

  await transaction(async (conn: mysql.PoolConnection) => {
    await conn.query(
      `UPDATE custom_cake_request
       SET status = ?,
           revision_notes = ?,
           revision_count = revision_count + 1,
           last_revised_at = NOW(),
           reviewed_by = ?
       WHERE request_id = ?`,
      [CustomCakeStatus.REVISION_REQUESTED, revision_notes, admin_id, requestId]
    );

    // Create notification
    await conn.query(
      `INSERT INTO custom_cake_notifications
       (request_id, notification_type, recipient_email, subject, message_body, status)
       VALUES (?, 'revision_requested', ?, ?, ?, 'pending')`,
      [
        requestId,
        request.customer_email,
        '🔄 Revision Requested for Your Cake',
        `We need some changes to your design. ${revision_notes}. Tracking: ${request.tracking_code}`,
      ]
    );
  });

  // Send notification
  emailService.sendCustomCakeNotification(Number(requestId), 'revision_requested').catch((error) => {
    logger.error('Failed to send notification:', error);
  });

  logger.info('✅ Revision requested');

  res.json(successResponse('Revision request sent to customer'));
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build timeline from status history
 */
function buildTimeline(request: CustomCakeRequestRow, statusHistory: any[]) {
  const timeline = [];

  // Define all possible events
  const events = [
    {
      status: CustomCakeStatus.DRAFT,
      name: 'Design Created',
      icon: '🎨',
    },
    {
      status: CustomCakeStatus.PENDING_REVIEW,
      name: 'Submitted for Review',
      icon: '📝',
    },
    {
      status: CustomCakeStatus.QUOTED,
      name: 'Quote Sent',
      icon: '💰',
    },
    {
      status: CustomCakeStatus.PAYMENT_PENDING_VERIFICATION,
      name: 'Payment Uploaded',
      icon: '💳',
    },
    {
      status: CustomCakeStatus.PAYMENT_VERIFIED,
      name: 'Payment Verified',
      icon: '✅',
    },
    {
      status: CustomCakeStatus.SCHEDULED,
      name: 'Pickup Scheduled',
      icon: '📅',
    },
    {
      status: CustomCakeStatus.IN_PRODUCTION,
      name: 'In Production',
      icon: '👨‍🍳',
    },
    {
      status: CustomCakeStatus.READY_FOR_PICKUP,
      name: 'Ready for Pickup',
      icon: '🎂',
    },
    {
      status: CustomCakeStatus.COMPLETED,
      name: 'Completed',
      icon: '🎉',
    },
  ];

  events.forEach((event) => {
    const historyEntry = statusHistory.find((h) => h.new_status === event.status);

    timeline.push({
      event_type: event.status,
      event_name: event.name,
      event_description: '',
      timestamp: historyEntry?.changed_at,
      is_completed: !!historyEntry,
      is_current: request.status === event.status,
      icon: event.icon,
    });
  });

  return timeline;
}
