import axios from 'axios';
import { log } from '@repo/logger';

// Standardized interface for stock price data used throughout the app
export interface StockPriceData {
  code: string;
  name: string;
  close: string;
}

interface DataDate {
  year: string;
  month: string;
  day: string;
}

// Interface for the raw JSON structure returned by TWSE/TPEX APIs
interface RawTable {
  fields: string[];
  data: string[][];
}

interface TwseResponse {
  stat: string;
  tables: RawTable[];
}

interface TpexResponse {
  stat: string;
  tables: RawTable[];
}

export class CrawlerService {
  /**
   * Safely parses raw table data into structured StockPriceData objects.
   */
  private static parseData(
    inputObject: RawTable,
    columnsToInclude: string[],
    overrideColumnNames: string[]
  ): StockPriceData[] {
    const { fields, data } = inputObject;

    // Create a map of Field Name -> Index for O(1) lookup
    const fieldIndices: Record<string, number> = {};
    fields.forEach((fieldName, index) => {
      fieldIndices[fieldName] = index;
    });

    const parsedData: StockPriceData[] = [];

    data.forEach((row: string[]) => {
      const obj: Record<string, string> = {};

      columnsToInclude.forEach((fieldName, index) => {
        const originalIndex = fieldIndices[fieldName];

        // 1. Verify existence: Does this field exist in the schema?
        if (typeof originalIndex !== 'number') {
          return;
        }

        // 2. Verify bounds: Does this row have data at that index?
        if (originalIndex < 0 || originalIndex >= row.length) {
          return;
        }

        // 3. Map raw data to target key
        const targetKey = overrideColumnNames[index];
        obj[targetKey] = row[originalIndex];
      });

      // 4. Verify we have all required keys
      if (Object.keys(obj).length !== overrideColumnNames.length) {
        return;
      }

      // Only add if we successfully extracted the required keys
      parsedData.push(obj as unknown as StockPriceData);
    });

    return parsedData;
  }

  private static async fetchTwse({ year, month, day }: DataDate): Promise<StockPriceData[]> {
    const url = `https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?date=${year}${month}${day}&type=ALLBUT0999&response=json`;
    log(`[Crawler] Fetching TWSE: ${url}`);

    try {
      const response = await axios.get<TwseResponse>(url);

      // Verify HTTP status and API status field
      if (response.status !== 200 || response.data.stat !== 'OK') {
        log(
          `[Crawler] TWSE Fetch Failed. Stat: ${response.data?.stat}, Status: ${response.status}`
        );
        return [];
      }

      const data = response.data;

      // Defensive Check: Ensure 'tables' array exists
      if (!Array.isArray(data.tables)) {
        log('[Crawler] TWSE invalid format: "tables" is not an array');
        return [];
      }

      // Hardcoded Index: Table 8 usually contains the stock quotes we need.
      // We check length to avoid IndexOutOfBounds
      const targetTable = data.tables.length > 8 ? data.tables[8] : null;

      if (!targetTable) {
        log('[Crawler] TWSE Table 8 not found in response');
        return [];
      }

      // Map columns: 證券代號 -> symbol, 證券名稱 -> name, 收盤價 -> close
      return this.parseData(
        targetTable,
        ['證券代號', '證券名稱', '收盤價'],
        ['code', 'name', 'close']
      );
    } catch (err) {
      log(`[Crawler] TWSE Error: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  private static async fetchTpex({ year, month, day }: DataDate): Promise<StockPriceData[]> {
    const url = `https://www.tpex.org.tw/www/zh-tw/afterTrading/dailyQuotes?date=${year}%2F${month}%2F${day}&id=&response=json`;
    log(`[Crawler] Fetching TPEX: ${url}`);

    try {
      const response = await axios.get<TpexResponse>(url);

      // TPEX uses "ok" or "OK" sometimes
      if (response.status !== 200 || (response.data.stat !== 'ok' && response.data.stat !== 'OK')) {
        log(
          `[Crawler] TPEX Fetch Failed. Stat: ${response.data?.stat}, Status: ${response.status}`
        );
        return [];
      }

      const data = response.data;

      if (!Array.isArray(data.tables)) {
        log('[Crawler] TPEX invalid format: "tables" is not an array');
        return [];
      }

      // TPEX data usually in Table 0
      const targetTable = data.tables.length > 0 ? data.tables[0] : null;

      if (!targetTable) {
        log('[Crawler] TPEX Table 0 not found');
        return [];
      }

      const parsed = this.parseData(
        targetTable,
        ['代號', '名稱', '收盤'],
        ['code', 'name', 'close']
      );

      // Filter: Keep only main stocks (symbol length < 6 usually excludes warrants/indices)
      return parsed.filter((row) => row.code.length < 6);
    } catch (err) {
      log(`[Crawler] TPEX Error: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  static async fetchDailyQuotes(dateStr: string): Promise<StockPriceData[]> {
    // dateStr format expected: YYYY-MM-DD
    const [year, month, day] = dateStr.split('-');

    log(`[Crawler] Starting job for date: ${year}-${month}-${day}`);

    const dataDate = { year, month, day };
    try {
      const [twseData, tpexData] = await Promise.all([
        this.fetchTwse(dataDate),
        this.fetchTpex(dataDate),
      ]);

      log(`[Crawler] Summary: ${twseData.length} TWSE items, ${tpexData.length} TPEX items.`);

      return [...twseData, ...tpexData];
    } catch (error) {
      log(`[Crawler] Job Failed: ${(error as Error).message}`);
      throw error;
    }
  }
}
