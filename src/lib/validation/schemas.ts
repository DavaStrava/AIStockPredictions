/**
 * Validation Schemas - Zod schemas for request validation
 *
 * These schemas provide type-safe validation for API requests and can be
 * reused across frontend and backend for consistent validation logic.
 *
 * Benefits:
 * - Type-safe validation with TypeScript inference
 * - Reusable across client and server
 * - Better error messages
 * - Automatic type generation from schemas
 */

import { z } from 'zod';

/**
 * Trade Validation Schemas
 */

export const TradeSideSchema = z.enum(['LONG', 'SHORT']);
export const TradeStatusSchema = z.enum(['OPEN', 'CLOSED']);

/**
 * Schema for creating a new trade
 */
export const CreateTradeSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(5, 'Symbol must be 5 characters or less')
    .regex(/^[A-Z]+$/, 'Symbol must contain only uppercase letters')
    .transform((val) => val.toUpperCase()),
  side: TradeSideSchema,
  entryPrice: z
    .number({
      required_error: 'Entry price is required',
      invalid_type_error: 'Entry price must be a number',
    })
    .positive('Entry price must be positive')
    .finite('Entry price must be a finite number'),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be positive')
    .finite('Quantity must be a finite number'),
  fees: z
    .number()
    .nonnegative('Fees must be non-negative')
    .finite('Fees must be a finite number')
    .optional()
    .default(0),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  predictionId: z.string().uuid('Prediction ID must be a valid UUID').optional(),
});

/**
 * Schema for creating a trade from the frontend (without userId)
 */
export const CreateTradeRequestSchema = CreateTradeSchema.omit({ userId: true });

/**
 * Schema for updating a trade
 */
export const UpdateTradeSchema = z.object({
  exitPrice: z
    .number()
    .positive('Exit price must be positive')
    .finite('Exit price must be a finite number')
    .optional(),
  fees: z
    .number()
    .nonnegative('Fees must be non-negative')
    .finite('Fees must be a finite number')
    .optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

/**
 * Schema for closing a trade
 */
export const CloseTradeSchema = z.object({
  exitPrice: z
    .number({
      required_error: 'Exit price is required',
      invalid_type_error: 'Exit price must be a number',
    })
    .positive('Exit price must be positive')
    .finite('Exit price must be a finite number'),
});

/**
 * Schema for trade filters (query parameters)
 */
export const TradeFiltersSchema = z.object({
  status: TradeStatusSchema.optional(),
  symbol: z
    .string()
    .max(5, 'Symbol must be 5 characters or less')
    .transform((val) => val.toUpperCase())
    .optional(),
  startDate: z
    .string()
    .datetime('Start date must be a valid ISO date')
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .datetime('End date must be a valid ISO date')
    .transform((val) => new Date(val))
    .optional(),
});

/**
 * Prediction Validation Schemas
 */

export const PredictionSymbolsSchema = z.object({
  symbols: z
    .string()
    .regex(/^[A-Z]+(,[A-Z]+)*$/, 'Symbols must be comma-separated uppercase letters')
    .optional(),
});

/**
 * Stock Analysis Validation Schemas
 */

export const StockAnalysisQuerySchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(5, 'Symbol must be 5 characters or less')
    .regex(/^[A-Z]+$/, 'Symbol must contain only uppercase letters'),
  timeframe: z
    .enum(['1d', '5d', '1m', '3m', '6m', '1y', '5y'])
    .optional()
    .default('1y'),
});

/**
 * Stock Search Validation Schemas
 */

export const StockSearchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(50, 'Search query must be 50 characters or less'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100)),
});

/**
 * Watchlist Validation Schemas
 */

export const CreateWatchlistSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

export const UpdateWatchlistSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

export const AddStockToWatchlistSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(5, 'Symbol must be 5 characters or less')
    .regex(/^[A-Z]+$/, 'Symbol must contain only uppercase letters')
    .transform((val) => val.toUpperCase()),
});

/**
 * Type exports - infer TypeScript types from schemas
 */
export type CreateTradeData = z.infer<typeof CreateTradeSchema>;
export type CreateTradeRequestData = z.infer<typeof CreateTradeRequestSchema>;
export type UpdateTradeData = z.infer<typeof UpdateTradeSchema>;
export type CloseTradeData = z.infer<typeof CloseTradeSchema>;
export type TradeFiltersData = z.infer<typeof TradeFiltersSchema>;
export type PredictionSymbolsData = z.infer<typeof PredictionSymbolsSchema>;
export type StockAnalysisQueryData = z.infer<typeof StockAnalysisQuerySchema>;
export type StockSearchQueryData = z.infer<typeof StockSearchQuerySchema>;
export type CreateWatchlistData = z.infer<typeof CreateWatchlistSchema>;
export type UpdateWatchlistData = z.infer<typeof UpdateWatchlistSchema>;
export type AddStockToWatchlistData = z.infer<typeof AddStockToWatchlistSchema>;
