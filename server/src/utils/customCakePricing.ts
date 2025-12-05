/**
 * Custom Cake Pricing Calculator
 * Helper functions for price estimation and breakdown
 */

import { CustomCakeRequest, PriceBreakdown } from '../types/customCake.types';

// ============================================================================
// PRICING CONSTANTS
// ============================================================================

export const PRICING_CONFIG = {
  BASE_PRICE: 500,

  // Per layer pricing (varies by size)
  LAYER_PRICES: {
    SMALL: 150, // 6-8 inches
    MEDIUM: 250, // 9-12 inches
    LARGE: 350, // 13-16 inches
    XLARGE: 500, // 17+ inches
  },

  // Frosting type costs
  FROSTING_COSTS: {
    buttercream: 0,
    fondant: 300,
    whipped_cream: 100,
    ganache: 200,
    cream_cheese: 150,
  },

  // Theme costs (can be overridden by database values)
  THEME_BASE_COST: 200,
  THEME_COSTS: {
    birthday: 200,
    wedding: 500,
    anniversary: 300,
    corporate: 400,
    holiday: 250,
    other: 200,
  },

  // Complexity multipliers
  COMPLEXITY_MULTIPLIERS: {
    SIMPLE: 1.0, // 1-2 layers, minimal decorations
    MEDIUM: 1.2, // 3 layers, some decorations
    COMPLEX: 1.5, // 4+ layers, custom text, 3D
    INTRICATE: 2.0, // 5 layers, extensive decorations, special requests
  },

  // Additional costs
  CANDLE_COST_PER_UNIT: 20,
  TEXT_COST: 100, // Base cost for adding text
  SPECIAL_TEXT_COST: 200, // Complex text (long, special fonts)
  DECORATION_3D_BASE: 150, // Per 3D decoration item

  // Rush order multiplier
  RUSH_MULTIPLIER: 1.2, // 20% extra for rush orders (< 3 days)
};

// ============================================================================
// COMPLEXITY DETERMINATION
// ============================================================================

/**
 * Determine complexity level based on design features
 */
export const determineComplexity = (request: Partial<CustomCakeRequest>): {
  level: 'SIMPLE' | 'MEDIUM' | 'COMPLEX' | 'INTRICATE';
  multiplier: number;
  factors: string[];
} => {
  const factors: string[] = [];
  let complexityScore = 0;

  // Layer count
  const layers = request.num_layers || 1;
  if (layers === 1) {
    complexityScore += 0;
    factors.push('Single layer');
  } else if (layers === 2) {
    complexityScore += 1;
    factors.push('Double layer');
  } else if (layers === 3) {
    complexityScore += 2;
    factors.push('Triple layer');
  } else if (layers >= 4) {
    complexityScore += 3;
    factors.push(`${layers} layers (complex structure)`);
  }

  // Frosting type
  if (request.frosting_type === 'fondant') {
    complexityScore += 2;
    factors.push('Fondant frosting (labor intensive)');
  } else if (request.frosting_type === 'ganache') {
    complexityScore += 1;
    factors.push('Ganache frosting');
  }

  // Text
  if (request.cake_text) {
    const textLength = request.cake_text.length;
    if (textLength > 50) {
      complexityScore += 2;
      factors.push('Long text message');
    } else if (textLength > 0) {
      complexityScore += 1;
      factors.push('Custom text');
    }
  }

  // 3D Decorations
  const decorations3D = request.decorations_3d || [];
  if (decorations3D.length > 0) {
    const decorationCount = decorations3D.length;
    if (decorationCount > 5) {
      complexityScore += 3;
      factors.push(`${decorationCount} 3D decorations (extensive)`);
    } else {
      complexityScore += decorationCount;
      factors.push(`${decorationCount} 3D decoration(s)`);
    }
  }

  // Theme
  if (request.theme_id) {
    complexityScore += 1;
    factors.push('Themed design');
  }

  // Special instructions
  if (request.special_instructions && request.special_instructions.length > 50) {
    complexityScore += 1;
    factors.push('Complex special instructions');
  }

  // Dietary restrictions (may require special ingredients)
  if (request.dietary_restrictions) {
    complexityScore += 1;
    factors.push('Special dietary requirements');
  }

  // Determine level
  let level: 'SIMPLE' | 'MEDIUM' | 'COMPLEX' | 'INTRICATE';
  let multiplier: number;

  if (complexityScore <= 2) {
    level = 'SIMPLE';
    multiplier = PRICING_CONFIG.COMPLEXITY_MULTIPLIERS.SIMPLE;
  } else if (complexityScore <= 5) {
    level = 'MEDIUM';
    multiplier = PRICING_CONFIG.COMPLEXITY_MULTIPLIERS.MEDIUM;
  } else if (complexityScore <= 8) {
    level = 'COMPLEX';
    multiplier = PRICING_CONFIG.COMPLEXITY_MULTIPLIERS.COMPLEX;
  } else {
    level = 'INTRICATE';
    multiplier = PRICING_CONFIG.COMPLEXITY_MULTIPLIERS.INTRICATE;
  }

  return { level, multiplier, factors };
};

// ============================================================================
// LAYER PRICING
// ============================================================================

/**
 * Get layer price based on size
 */
export const getLayerPrice = (sizeDiameterCm?: number): number => {
  if (!sizeDiameterCm) return PRICING_CONFIG.LAYER_PRICES.SMALL;

  // Convert cm to inches (approximate)
  const inches = sizeDiameterCm / 2.54;

  if (inches < 9) return PRICING_CONFIG.LAYER_PRICES.SMALL;
  if (inches < 13) return PRICING_CONFIG.LAYER_PRICES.MEDIUM;
  if (inches < 17) return PRICING_CONFIG.LAYER_PRICES.LARGE;
  return PRICING_CONFIG.LAYER_PRICES.XLARGE;
};

/**
 * Calculate total layers cost
 */
export const calculateLayersCost = (
  request: Partial<CustomCakeRequest>,
  sizesData?: Array<{ size_id: number; diameter_cm: number }>
): number => {
  let total = 0;
  const layers = request.num_layers || 1;

  for (let i = 1; i <= layers; i++) {
    const sizeIdKey = `layer_${i}_size_id` as keyof typeof request;
    const sizeId = request[sizeIdKey] as number | undefined;

    // Find diameter from sizesData
    const sizeInfo = sizesData?.find(s => s.size_id === sizeId);
    const diameter = sizeInfo?.diameter_cm;

    total += getLayerPrice(diameter);
  }

  return total;
};

// ============================================================================
// DECORATIONS PRICING
// ============================================================================

/**
 * Calculate decorations cost
 */
export const calculateDecorationsCost = (request: Partial<CustomCakeRequest>): number => {
  let total = 0;

  // 3D Decorations
  const decorations3D = request.decorations_3d || [];
  total += decorations3D.length * PRICING_CONFIG.DECORATION_3D_BASE;

  // Candles
  const candlesCount = request.candles_count || 0;
  total += candlesCount * PRICING_CONFIG.CANDLE_COST_PER_UNIT;

  return total;
};

// ============================================================================
// TEXT PRICING
// ============================================================================

/**
 * Calculate text cost
 */
export const calculateTextCost = (request: Partial<CustomCakeRequest>): number => {
  if (!request.cake_text || request.cake_text.trim().length === 0) {
    return 0;
  }

  const textLength = request.cake_text.length;
  const isSpecialFont = request.text_font && ['elegant', 'playful', 'modern'].includes(request.text_font);

  if (textLength > 50 || isSpecialFont) {
    return PRICING_CONFIG.SPECIAL_TEXT_COST;
  }

  return PRICING_CONFIG.TEXT_COST;
};

// ============================================================================
// MAIN PRICE CALCULATOR
// ============================================================================

/**
 * Calculate suggested price with detailed breakdown
 */
export const calculateSuggestedPrice = (
  request: Partial<CustomCakeRequest>,
  options?: {
    sizesData?: Array<{ size_id: number; diameter_cm: number }>;
    themesCost?: Record<number, number>; // theme_id -> cost
    preparationDays?: number;
  }
): PriceBreakdown => {
  // Base price
  const base_price = PRICING_CONFIG.BASE_PRICE;

  // Layers cost
  const layers_cost = calculateLayersCost(request, options?.sizesData);

  // Decorations cost
  const decorations_cost = calculateDecorationsCost(request);

  // Frosting cost
  const frostingType = request.frosting_type || 'buttercream';
  const frostingCost = PRICING_CONFIG.FROSTING_COSTS[frostingType as keyof typeof PRICING_CONFIG.FROSTING_COSTS] || 0;

  // Theme cost
  let theme_cost = 0;
  if (request.theme_id && options?.themesCost) {
    theme_cost = options.themesCost[request.theme_id] || PRICING_CONFIG.THEME_BASE_COST;
  } else if (request.theme_id) {
    theme_cost = PRICING_CONFIG.THEME_BASE_COST;
  }

  // Text cost
  const text_cost = calculateTextCost(request);

  // Special requests cost (dietary restrictions, complex instructions)
  let special_requests_cost = 0;
  if (request.dietary_restrictions) {
    special_requests_cost += 150; // Special ingredients cost
  }
  if (request.special_instructions && request.special_instructions.length > 100) {
    special_requests_cost += 100; // Complex special requests
  }

  // Calculate subtotal
  let subtotal = base_price + layers_cost + decorations_cost + frostingCost + theme_cost + text_cost + special_requests_cost;

  // Complexity multiplier
  const complexity = determineComplexity(request);
  const complexity_multiplier = complexity.multiplier;

  // Apply complexity multiplier
  subtotal = Math.round(subtotal * complexity_multiplier);

  // Rush order check (if preparation days < 3)
  let rushMultiplier = 1.0;
  if (options?.preparationDays && options.preparationDays < 3) {
    rushMultiplier = PRICING_CONFIG.RUSH_MULTIPLIER;
    subtotal = Math.round(subtotal * rushMultiplier);
  }

  // Total
  const total = subtotal;

  // Build notes
  const notes = [
    `Complexity: ${complexity.level}`,
    ...complexity.factors,
    rushMultiplier > 1.0 ? 'Rush order (+20%)' : null,
  ]
    .filter(Boolean)
    .join('; ');

  return {
    base_price,
    layers_cost,
    decorations_cost: decorations_cost + frostingCost + text_cost,
    theme_cost,
    complexity_multiplier,
    special_requests_cost,
    total,
    notes,
  };
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return `₱${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Calculate estimated preparation time in days
 */
export const calculatePreparationDays = (request: Partial<CustomCakeRequest>): number => {
  const complexity = determineComplexity(request);

  switch (complexity.level) {
    case 'SIMPLE':
      return 2;
    case 'MEDIUM':
      return 3;
    case 'COMPLEX':
      return 5;
    case 'INTRICATE':
      return 7;
    default:
      return 3;
  }
};
