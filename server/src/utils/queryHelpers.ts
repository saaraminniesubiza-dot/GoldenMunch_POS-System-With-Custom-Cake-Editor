/**
 * Query Helper Functions
 *
 * These helpers ensure type-safe access to Express request properties
 * and MySQL query results.
 */

import { Request } from 'express';

/**
 * Safely parse pagination from query params
 */
export function parsePagination(query: Request['query']) {
  const page = parseInt(query.page as string || '1', 10);
  const limit = parseInt(query.limit as string || '20', 10);

  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: isNaN(limit) || limit < 1 ? 20 : Math.min(limit, 100),
    offset: ((isNaN(page) || page < 1 ? 1 : page) - 1) * (isNaN(limit) || limit < 1 ? 20 : Math.min(limit, 100))
  };
}

/**
 * Safely get string from query param
 */
export function getQueryString(value: any, defaultValue: string = ''): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value[0]) return String(value[0]);
  return defaultValue;
}

/**
 * Safely get number from query param
 */
export function getQueryNumber(value: any, defaultValue?: number): number | undefined {
  if (value === undefined || value === null) return defaultValue;
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely get boolean from query param
 */
export function getQueryBoolean(value: any, defaultValue: boolean = false): boolean {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return defaultValue;
}

/**
 * Extract typed body from request
 */
export function getTypedBody<T>(req: Request): T {
  return req.body as T;
}
