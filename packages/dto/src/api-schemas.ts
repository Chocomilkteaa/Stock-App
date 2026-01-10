/**
 * API Schemas Module
 *
 * Zod schemas for API request/response validation.
 * Provides both runtime validation (Zod) and static types (TypeScript).
 */
import { z } from "zod";

// ===========================
// Request Parameter Schemas
// ===========================

/**
 * Schema for daily data requests (YYYY-MM-DD format).
 */
export const DateParamsSchema = z.object({
  date: z.iso.date(),
});

/**
 * Schema for monthly data requests (YYYY-MM format).
 */
export const MonthParamsSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Invalid month format. Expected YYYY-MM"),
});

/**
 * Schema for quarterly data requests (YYYY-QN format).
 */
export const QuarterParamsSchema = z.object({
  quarter: z
    .string()
    .regex(/^\d{4}-Q[1-4]$/, "Invalid quarter format. Expected YYYY-QN"),
});

// ===========================
// Inferred Request Types
// ===========================

/** Type for daily data request parameters */
export type DateParams = z.infer<typeof DateParamsSchema>;

/** Type for monthly data request parameters */
export type MonthParams = z.infer<typeof MonthParamsSchema>;

/** Type for quarterly data request parameters */
export type QuarterParams = z.infer<typeof QuarterParamsSchema>;

// ===========================
// API Response Types
// ===========================

/**
 * Standard API response wrapper.
 * All API endpoints return data in this format.
 *
 * @template T - The type of the data array
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Human-readable message about the operation */
  message: string;
  /** Number of records returned (when successful) */
  count?: number;
  /** The actual data array (when successful) */
  data?: T[];
  /** Error details (when unsuccessful) */
  error?: unknown;
}

/**
 * Creates a successful API response.
 *
 * @template T - The type of the data items
 * @param data - Array of data items
 * @param message - Success message
 * @returns Formatted API response object
 */
export function createSuccessResponse<T>(
  data: T[],
  message: string = "Data fetched successfully!"
): ApiResponse<T> {
  return {
    success: true,
    message,
    count: data.length,
    data,
  };
}

/**
 * Creates an error API response.
 *
 * @param message - Error message
 * @param error - Optional error details
 * @returns Formatted error response object
 */
export function createErrorResponse(
  message: string,
  error?: unknown
): ApiResponse<never> {
  return {
    success: false,
    message,
    error,
  };
}
