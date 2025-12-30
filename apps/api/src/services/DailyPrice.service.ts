import axios from 'axios';
import { log } from '@repo/logger';
import { DailyPriceModel } from '../models/DailyPrice.model.js';

// Standardized interface for stock daily price data used throughout the app
export interface DailyPriceData {
  code: string;
  name: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

export class DailyPriceService {
  /**
   * Safely parses raw table data into structured DailyPriceData objects.
   */
  private static parseData(
    inputObject: RawTable,
    columnsToInclude: string[],
    overrideColumnNames: (keyof DailyPriceData)[]
  ): DailyPriceData[] {
    const { fields, data } = inputObject;

    // Create a map of Field Name -> Index for O(1) lookup
    const fieldIndices: Record<string, number> = {};
    fields.forEach((fieldName, index) => {
      fieldIndices[fieldName] = index;
    });

    const parsedData: DailyPriceData[] = [];

    data.forEach((row: string[]) => {
      const obj: Partial<DailyPriceData> = {};

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

        // 3. Map raw data to target key with type conversion
        const targetKey = overrideColumnNames[index];
        const rawValue = row[originalIndex];

        if (
          targetKey === 'open' ||
          targetKey === 'high' ||
          targetKey === 'low' ||
          targetKey === 'close' ||
          targetKey === 'volume'
        ) {
          // Remove commas and parse float
          const cleanValue = rawValue.replace(/,/g, '').trim();
          // Handle cases like '--' which TWSE uses for no data
          const numValue = parseFloat(cleanValue);
          obj[targetKey] = isNaN(numValue) ? 0 : numValue;
        } else {
          obj[targetKey] = rawValue;
        }
      });

      // 4. Verify we have all required keys
      // We check if the object has the expected number of keys.
      // Note: This assumes all columnsToInclude are required.
      if (Object.keys(obj).length !== overrideColumnNames.length) {
        return;
      }

      // Only add if we successfully extracted the required keys
      parsedData.push(obj as DailyPriceData);
    });

    return parsedData;
  }

  private static async fetchTwse({ year, month, day }: DataDate): Promise<DailyPriceData[]> {
    const url = `https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?date=${year}${month}${day}&type=ALLBUT0999&response=json`;
    log(`[DailyPriceService] Fetching TWSE: ${url}`);

    try {
      const response = await axios.get<TwseResponse>(url);

      // Verify HTTP status and API status field
      if (response.status !== 200 || response.data.stat !== 'OK') {
        log(
          `[DailyPriceService] TWSE Fetch Failed. Stat: ${response.data?.stat}, Status: ${response.status}`
        );
        return [];
      }

      const data = response.data;

      // Defensive Check: Ensure 'tables' array exists
      if (!Array.isArray(data.tables)) {
        log('[DailyPriceService] TWSE invalid format: "tables" is not an array');
        return [];
      }

      // Hardcoded Index: Table 8 usually contains the stock quotes we need.
      // We check length to avoid IndexOutOfBounds
      const targetTable = data.tables.length > 8 ? data.tables[8] : null;

      if (!targetTable) {
        log('[DailyPriceService] TWSE Table 8 not found in response');
        return [];
      }

      // Map columns: 證券代號 -> symbol, 證券名稱 -> name, 收盤價 -> close
      return this.parseData(
        targetTable,
        ['證券代號', '證券名稱', '開盤價', '最高價', '最低價', '收盤價', '成交股數'],
        ['code', 'name', 'open', 'high', 'low', 'close', 'volume']
      );
    } catch (err) {
      log(`[DailyPriceService] TWSE Error: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  private static async fetchTpex({ year, month, day }: DataDate): Promise<DailyPriceData[]> {
    const url = `https://www.tpex.org.tw/www/zh-tw/afterTrading/dailyQuotes?date=${year}%2F${month}%2F${day}&id=&response=json`;
    log(`[DailyPriceService] Fetching TPEX: ${url}`);

    try {
      const response = await axios.get<TpexResponse>(url);

      // TPEX uses "ok" or "OK" sometimes
      if (response.status !== 200 || (response.data.stat !== 'ok' && response.data.stat !== 'OK')) {
        log(
          `[DailyPriceService] TPEX Fetch Failed. Stat: ${response.data?.stat}, Status: ${response.status}`
        );
        return [];
      }

      const data = response.data;

      if (!Array.isArray(data.tables)) {
        log('[DailyPriceService] TPEX invalid format: "tables" is not an array');
        return [];
      }

      // TPEX data usually in Table 0
      const targetTable = data.tables.length > 0 ? data.tables[0] : null;

      if (!targetTable) {
        log('[DailyPriceService] TPEX Table 0 not found');
        return [];
      }

      const parsed = this.parseData(
        targetTable,
        ['代號', '名稱', '收盤', '開盤', '最高', '最低', '成交股數'],
        ['code', 'name', 'close', 'open', 'high', 'low', 'volume']
      );

      // Filter: Keep only main stocks (symbol length < 6 usually excludes warrants/indices)
      return parsed.filter((row) => row.code.length < 6);
    } catch (err) {
      log(`[DailyPriceService] TPEX Error: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  static async fetchDailyPrices(dateStr: string): Promise<DailyPriceData[]> {
    // dateStr format expected: YYYY-MM-DD
    const [year, month, day] = dateStr.split('-');

    // 1. Check Database first
    const existingData = await DailyPriceModel.getDailyPricesByDate(dateStr);
    if (existingData.length > 0) {
      log(`[DailyPriceService] Check DB: Found ${existingData.length} records.`);
      return existingData;
    }

    // 2. Crawl
    log(`[DailyPriceService] Check DB: No data. Starting crawl job for ${year}-${month}-${day}`);
    const dataDate = { year, month, day };

    const [twseData, tpexData] = await Promise.all([
      this.fetchTwse(dataDate),
      this.fetchTpex(dataDate),
    ]);

    log(
      `[DailyPriceService] Crawl Summary: ${twseData.length} TWSE items, ${tpexData.length} TPEX items.`
    );
    const allData = [...twseData, ...tpexData];

    if (allData.length === 0) {
      log(`[DailyPriceService] No data found from sources.`);
      return [];
    }

    // 3. Save to DB
    await DailyPriceModel.saveStocksAndPrices(allData, dateStr);

    return allData;
  }
}
