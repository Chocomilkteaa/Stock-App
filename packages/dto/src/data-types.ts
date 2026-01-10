/**
 * Data Types Module
 *
 * Defines the available data types for the Stock-App and their configurations.
 * Used by both frontend (UI selectors) and backend (API routing).
 */

// ===========================
// Data Type Enum
// ===========================

/**
 * Available data types for fetching stock information.
 * These correspond to different API endpoints and data sources.
 */
export type DataType =
  | "daily-prices"
  | "monthly-revenues"
  | "quarterly-eps"
  | "quarterly-capital"
  | "quarterly-cash-flow";

// ===========================
// Data Type Configuration
// ===========================

/**
 * Configuration options for each data type.
 * Controls UI behavior and API request formatting.
 */
export interface DataTypeConfig {
  /** Human-readable display label */
  label: string;
  /** Type of date picker to show in UI */
  dateFormat: "date" | "month" | "quarter";
  /** Format string for API request (dayjs format) */
  apiDateFormat: string;
}

/**
 * Configuration mapping for all available data types.
 * Used to generate UI elements and format API requests.
 */
export const DATA_TYPE_CONFIG: Record<DataType, DataTypeConfig> = {
  "daily-prices": {
    label: "Daily Prices",
    dateFormat: "date",
    apiDateFormat: "YYYY-MM-DD",
  },
  "monthly-revenues": {
    label: "Monthly Revenue",
    dateFormat: "month",
    apiDateFormat: "YYYY-MM",
  },
  "quarterly-eps": {
    label: "Quarterly EPS",
    dateFormat: "quarter",
    apiDateFormat: "YYYY-[Q]Q", // Custom format: YYYY-Q1, YYYY-Q2, etc.
  },
  "quarterly-capital": {
    label: "Quarterly Capital",
    dateFormat: "quarter",
    apiDateFormat: "YYYY-[Q]Q",
  },
  "quarterly-cash-flow": {
    label: "Quarterly Cash Flow",
    dateFormat: "quarter",
    apiDateFormat: "YYYY-[Q]Q",
  },
};

// ===========================
// Quarter Configuration
// ===========================

/**
 * Quarter option for UI selector.
 */
export interface QuarterOption {
  value: number;
  label: string;
}

/**
 * Available quarters for the quarter selector dropdown.
 */
export const QUARTERS: QuarterOption[] = [
  { value: 1, label: "Q1 (Jan-Mar)" },
  { value: 2, label: "Q2 (Apr-Jun)" },
  { value: 3, label: "Q3 (Jul-Sep)" },
  { value: 4, label: "Q4 (Oct-Dec)" },
];
