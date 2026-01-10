/**
 * Quarterly Cash Flow Entity
 *
 * Represents quarterly cash flow statement data for listed companies.
 */

/**
 * Quarterly cash flow data for a single company.
 * Contains operating, investing, and financing cash flows.
 */
export interface QuarterlyCashFlowData {
  /** Stock code (e.g., "2330") */
  code: string;
  /** Company name */
  name: string;
  /** Net cash flow from operating activities (營業活動之現金流量) */
  operatingCashFlow: number;
  /** Net cash flow from investing activities (投資活動之現金流量) */
  investingCashFlow: number;
  /** Net cash flow from financing activities (籌資活動之現金流量) */
  financingCashFlow: number;
  /** Effect of exchange rate changes on cash (匯率變動對現金之影響) */
  exchangeRateEffect: number;
  /** Net increase/decrease in cash for the period (本期現金增減數) */
  netCashChange: number;
  /** Cash balance at beginning of period (期初現金餘額) */
  beginningCashBalance: number;
  /** Cash balance at end of period (期末現金餘額) */
  endingCashBalance: number;
}
