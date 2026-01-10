/**
 * Daily Price Entity
 *
 * Represents daily stock price data from TWSE/TPEX exchanges.
 */

/**
 * Daily price data for a single stock.
 * Contains OHLCV (Open, High, Low, Close, Volume) data.
 */
export interface DailyPriceData {
  /** Stock code (e.g., "2330") */
  code: string;
  /** Company name */
  name: string;
  /** Opening price */
  open: number;
  /** Highest price during the day */
  high: number;
  /** Lowest price during the day */
  low: number;
  /** Closing price */
  close: number;
  /** Trading volume (number of shares) */
  volume: number;
}
