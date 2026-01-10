/**
 * @repo/dto - Shared Data Transfer Objects
 *
 * This package provides shared types, schemas, and constants
 * for data exchange between frontend and backend applications.
 *
 * @example
 * ```typescript
 * import { DataType, DailyPriceData, ApiResponse } from "@repo/dto";
 * ```
 */

// ===========================
// Data Types & Configuration
// ===========================
export {
  type DataType,
  type DataTypeConfig,
  type QuarterOption,
  DATA_TYPE_CONFIG,
  QUARTERS,
} from "./data-types.js";

// ===========================
// API Schemas & Response Types
// ===========================
export {
  // Zod Schemas
  DateParamsSchema,
  MonthParamsSchema,
  QuarterParamsSchema,
  // Inferred Types
  type DateParams,
  type MonthParams,
  type QuarterParams,
  // Response Types & Helpers
  type ApiResponse,
  createSuccessResponse,
  createErrorResponse,
} from "./api-schemas.js";

// ===========================
// Entity Types
// ===========================
export type {
  DailyPriceData,
  MonthlyRevenueData,
  QuarterlyEpsData,
  QuarterlyCapitalData,
  QuarterlyCashFlowData,
} from "./entities/index.js";
