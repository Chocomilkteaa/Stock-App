/**
 * Monthly Revenue Entity
 *
 * Represents monthly revenue data for listed companies.
 */

/**
 * Monthly revenue data for a single company.
 * Contains current and comparative revenue metrics.
 */
export interface MonthlyRevenueData {
  /** Stock code (e.g., "2330") */
  code: string;
  /** Company name */
  name: string;
  /** Current month's revenue (in thousand TWD) */
  monthlyRevenue: number;
  /** Last month's revenue (in thousand TWD) */
  lastMonthRevenue: number;
  /** Same month last year's revenue (in thousand TWD) */
  lastYearMonthlyRevenue: number;
  /** Month-over-month change percentage */
  previousMonthChangePercent: number;
  /** Year-over-year same month change percentage */
  lastYearSameMonthChangePercent: number;
  /** Cumulative revenue for the year (in thousand TWD) */
  cumulativeRevenue: number;
  /** Last year's cumulative revenue (in thousand TWD) */
  lastYearCumulativeRevenue: number;
  /** Cumulative year-over-year change percentage */
  cumulativePreviousPeriodChangePercent: number;
  /** Additional remarks or notes */
  remarks: string | null;
}
