/**
 * Express type declarations
 * Extends Express Request to support our custom properties
 */

import { JwtPayload } from '../models/types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
