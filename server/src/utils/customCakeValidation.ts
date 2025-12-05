/**
 * Custom Cake System - Validation Utilities
 * Centralized validation logic for type safety and error prevention
 */

import {
  ContactConfirmationData,
  UploadPaymentReceiptRequest,
  CreateQuoteRequest,
  SchedulePickupRequest,
  SubmitFeedbackRequest,
  ValidationError,
  ValidationResult,
  CustomCakeRequest,
  PaymentMethod,
} from '../types/customCake.types';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate Philippine phone number
 */
export const validatePhilippinePhone = (phone: string): boolean => {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[-\s]/g, '');

  // Philippine mobile number patterns:
  // - 09XXXXXXXXX (11 digits starting with 09)
  // - +639XXXXXXXXX (13 digits starting with +639)
  // - 639XXXXXXXXX (12 digits starting with 639)
  const patterns = [
    /^09\d{9}$/, // 09XXXXXXXXX
    /^\+639\d{9}$/, // +639XXXXXXXXX
    /^639\d{9}$/, // 639XXXXXXXXX
  ];

  return patterns.some(pattern => pattern.test(cleaned));
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate tracking code format
 */
export const validateTrackingCode = (code: string): boolean => {
  // Format: CAKE-YYYY-NNNNN
  const trackingCodeRegex = /^CAKE-\d{4}-\d{5}$/;
  return trackingCodeRegex.test(code);
};

/**
 * Validate price (must be positive number with max 2 decimal places)
 */
export const validatePrice = (price: number): boolean => {
  if (typeof price !== 'number' || isNaN(price)) return false;
  if (price <= 0) return false;

  // Check max 2 decimal places
  const decimalPlaces = (price.toString().split('.')[1] || '').length;
  return decimalPlaces <= 2;
};

/**
 * Validate date string (YYYY-MM-DD format)
 */
export const validateDateString = (dateStr: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validate time string (HH:MM format)
 */
export const validateTimeString = (timeStr: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day
  return date >= now;
};

/**
 * Validate base64 image string
 */
export const validateBase64Image = (base64: string): boolean => {
  // Check if it's a valid base64 string with image prefix
  const base64Regex = /^data:image\/(png|jpeg|jpg|gif);base64,/;
  return base64Regex.test(base64);
};

/**
 * Validate rating (1-5 stars)
 */
export const validateRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

/**
 * Validate contact confirmation data
 */
export const validateContactInfo = (data: ContactConfirmationData): ValidationResult => {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.customer_name || data.customer_name.trim().length < 2) {
    errors.push({
      field: 'customer_name',
      message: 'Name must be at least 2 characters long',
    });
  }

  if (data.customer_name && data.customer_name.trim().length > 100) {
    errors.push({
      field: 'customer_name',
      message: 'Name must be less than 100 characters',
    });
  }

  // Email validation
  if (!data.customer_email) {
    errors.push({
      field: 'customer_email',
      message: 'Email address is required',
    });
  } else if (!validateEmail(data.customer_email)) {
    errors.push({
      field: 'customer_email',
      message: 'Please enter a valid email address',
    });
  }

  // Phone validation
  if (!data.customer_phone) {
    errors.push({
      field: 'customer_phone',
      message: 'Phone number is required',
    });
  } else if (!validatePhilippinePhone(data.customer_phone)) {
    errors.push({
      field: 'customer_phone',
      message: 'Please enter a valid Philippine phone number (e.g., 09171234567)',
    });
  }

  // Confirmation validation
  if (!data.confirmed) {
    errors.push({
      field: 'confirmed',
      message: 'Please confirm your contact details are correct',
    });
  }

  // Terms acceptance validation
  if (!data.terms_accepted) {
    errors.push({
      field: 'terms_accepted',
      message: 'Please accept the terms and conditions',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate payment receipt upload data
 */
export const validatePaymentReceipt = (data: UploadPaymentReceiptRequest): ValidationResult => {
  const errors: ValidationError[] = [];

  // Tracking code
  if (!data.tracking_code) {
    errors.push({
      field: 'tracking_code',
      message: 'Tracking code is required',
    });
  } else if (!validateTrackingCode(data.tracking_code)) {
    errors.push({
      field: 'tracking_code',
      message: 'Invalid tracking code format',
    });
  }

  // Payment amount
  if (!data.payment_amount || data.payment_amount <= 0) {
    errors.push({
      field: 'payment_amount',
      message: 'Payment amount must be greater than 0',
    });
  } else if (!validatePrice(data.payment_amount)) {
    errors.push({
      field: 'payment_amount',
      message: 'Invalid payment amount format',
    });
  }

  // Payment method
  if (!data.payment_method) {
    errors.push({
      field: 'payment_method',
      message: 'Payment method is required',
    });
  } else if (!Object.values(PaymentMethod).includes(data.payment_method)) {
    errors.push({
      field: 'payment_method',
      message: 'Invalid payment method',
    });
  }

  // Receipt file
  if (!data.receipt_file) {
    errors.push({
      field: 'receipt_file',
      message: 'Please upload a receipt image',
    });
  } else if (!validateBase64Image(data.receipt_file)) {
    errors.push({
      field: 'receipt_file',
      message: 'Invalid image format. Please upload a valid image (PNG, JPEG, JPG, GIF)',
    });
  }

  // Payment date (optional but validate if provided)
  if (data.payment_date && !validateDateString(data.payment_date)) {
    errors.push({
      field: 'payment_date',
      message: 'Invalid payment date format. Use YYYY-MM-DD',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate quote creation data
 */
export const validateQuoteData = (data: CreateQuoteRequest): ValidationResult => {
  const errors: ValidationError[] = [];

  // Quoted price
  if (!data.quoted_price || data.quoted_price <= 0) {
    errors.push({
      field: 'quoted_price',
      message: 'Quote price must be greater than 0',
    });
  } else if (!validatePrice(data.quoted_price)) {
    errors.push({
      field: 'quoted_price',
      message: 'Invalid price format. Use up to 2 decimal places',
    });
  }

  // Check reasonable price range (₱100 - ₱50,000)
  if (data.quoted_price < 100) {
    errors.push({
      field: 'quoted_price',
      message: 'Quote price seems too low. Minimum ₱100',
    });
  }

  if (data.quoted_price > 50000) {
    errors.push({
      field: 'quoted_price',
      message: 'Quote price seems too high. Maximum ₱50,000. Please verify.',
    });
  }

  // Preparation days
  if (!data.preparation_days || data.preparation_days < 1) {
    errors.push({
      field: 'preparation_days',
      message: 'Preparation days must be at least 1',
    });
  }

  if (data.preparation_days > 30) {
    errors.push({
      field: 'preparation_days',
      message: 'Preparation days should not exceed 30. Please verify.',
    });
  }

  // Validate price breakdown if provided
  if (data.quote_breakdown) {
    const breakdown = data.quote_breakdown;

    if (breakdown.total !== data.quoted_price) {
      errors.push({
        field: 'quote_breakdown',
        message: 'Breakdown total must match quoted price',
      });
    }

    // Validate all breakdown components are non-negative
    const components = [
      'base_price',
      'layers_cost',
      'decorations_cost',
      'theme_cost',
      'special_requests_cost',
    ];

    components.forEach(component => {
      const value = breakdown[component as keyof typeof breakdown];
      if (typeof value === 'number' && value < 0) {
        errors.push({
          field: `quote_breakdown.${component}`,
          message: `${component} cannot be negative`,
        });
      }
    });

    if (breakdown.complexity_multiplier < 1) {
      errors.push({
        field: 'quote_breakdown.complexity_multiplier',
        message: 'Complexity multiplier must be at least 1.0',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate pickup scheduling data
 */
export const validateSchedulePickup = (data: SchedulePickupRequest): ValidationResult => {
  const errors: ValidationError[] = [];

  // Pickup date
  if (!data.scheduled_pickup_date) {
    errors.push({
      field: 'scheduled_pickup_date',
      message: 'Pickup date is required',
    });
  } else if (!validateDateString(data.scheduled_pickup_date)) {
    errors.push({
      field: 'scheduled_pickup_date',
      message: 'Invalid date format. Use YYYY-MM-DD',
    });
  } else if (!isFutureDate(data.scheduled_pickup_date)) {
    errors.push({
      field: 'scheduled_pickup_date',
      message: 'Pickup date must be in the future',
    });
  }

  // Pickup time
  if (!data.scheduled_pickup_time) {
    errors.push({
      field: 'scheduled_pickup_time',
      message: 'Pickup time is required',
    });
  } else if (!validateTimeString(data.scheduled_pickup_time)) {
    errors.push({
      field: 'scheduled_pickup_time',
      message: 'Invalid time format. Use HH:MM (e.g., 14:30)',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate feedback submission
 */
export const validateFeedback = (data: SubmitFeedbackRequest): ValidationResult => {
  const errors: ValidationError[] = [];

  // Tracking code
  if (!data.tracking_code) {
    errors.push({
      field: 'tracking_code',
      message: 'Tracking code is required',
    });
  } else if (!validateTrackingCode(data.tracking_code)) {
    errors.push({
      field: 'tracking_code',
      message: 'Invalid tracking code format',
    });
  }

  // Rating
  if (!data.rating) {
    errors.push({
      field: 'rating',
      message: 'Rating is required',
    });
  } else if (!validateRating(data.rating)) {
    errors.push({
      field: 'rating',
      message: 'Rating must be between 1 and 5 stars',
    });
  }

  // Feedback text (optional but validate length if provided)
  if (data.feedback && data.feedback.length > 1000) {
    errors.push({
      field: 'feedback',
      message: 'Feedback must be less than 1000 characters',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate custom cake design data
 */
export const validateDesignData = (data: Partial<CustomCakeRequest>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.num_layers || data.num_layers < 1 || data.num_layers > 5) {
    errors.push({
      field: 'num_layers',
      message: 'Number of layers must be between 1 and 5',
    });
  }

  // Event date (if provided, must be future)
  if (data.event_date) {
    if (!validateDateString(data.event_date)) {
      errors.push({
        field: 'event_date',
        message: 'Invalid event date format. Use YYYY-MM-DD',
      });
    } else if (!isFutureDate(data.event_date)) {
      errors.push({
        field: 'event_date',
        message: 'Event date must be in the future',
      });
    }
  }

  // Validate each layer has flavor and size
  for (let i = 1; i <= (data.num_layers || 0); i++) {
    const flavorKey = `layer_${i}_flavor_id` as keyof typeof data;
    const sizeKey = `layer_${i}_size_id` as keyof typeof data;

    if (!data[flavorKey]) {
      errors.push({
        field: flavorKey,
        message: `Layer ${i} must have a flavor selected`,
      });
    }

    if (!data[sizeKey]) {
      errors.push({
        field: sizeKey,
        message: `Layer ${i} must have a size selected`,
      });
    }
  }

  // Validate frosting type
  const validFrostingTypes = ['buttercream', 'fondant', 'whipped_cream', 'ganache', 'cream_cheese'];
  if (data.frosting_type && !validFrostingTypes.includes(data.frosting_type)) {
    errors.push({
      field: 'frosting_type',
      message: 'Invalid frosting type',
    });
  }

  // Validate candle count
  if (data.candles_count !== undefined && (data.candles_count < 0 || data.candles_count > 100)) {
    errors.push({
      field: 'candles_count',
      message: 'Candle count must be between 0 and 100',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Format Philippine phone number to standard format
 */
export const formatPhilippinePhone = (phone: string): string => {
  const cleaned = phone.replace(/[-\s]/g, '');

  // Convert to 09XXXXXXXXX format
  if (cleaned.startsWith('+639')) {
    return '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('639')) {
    return '0' + cleaned.slice(2);
  }

  return cleaned;
};

/**
 * Check if receipt amount matches quoted price (within tolerance)
 */
export const checkPaymentMatch = (
  paidAmount: number,
  quotedPrice: number,
  tolerance: number = 0
): { matches: boolean; difference: number; status: 'exact' | 'overpaid' | 'underpaid' } => {
  const difference = paidAmount - quotedPrice;

  if (Math.abs(difference) <= tolerance) {
    return { matches: true, difference, status: 'exact' };
  } else if (difference > 0) {
    return { matches: false, difference, status: 'overpaid' };
  } else {
    return { matches: false, difference, status: 'underpaid' };
  }
};
