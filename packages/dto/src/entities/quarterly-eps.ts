/**
 * Quarterly EPS Entity
 *
 * Represents quarterly earnings per share data for listed companies.
 */

/**
 * Quarterly EPS (Earnings Per Share) data for a single company.
 */
export interface QuarterlyEpsData {
  /** Stock code (e.g., "2330") */
  code: string;
  /** Company name */
  name: string;
  /** Basic earnings per share (in TWD) */
  eps: number;
}
