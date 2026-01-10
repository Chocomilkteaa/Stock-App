/**
 * Quarterly Capital Entity
 *
 * Represents quarterly paid-in capital data for listed companies.
 */

/**
 * Quarterly capital (股本) data for a single company.
 */
export interface QuarterlyCapitalData {
  /** Stock code (e.g., "2330") */
  code: string;
  /** Company name */
  name: string;
  /** Paid-in capital in TWD */
  capital: number;
}
