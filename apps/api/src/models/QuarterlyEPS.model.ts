import { eq, sql } from "drizzle-orm";
import { db } from "../database/db.js";
import { quarterlyEps, stocks } from "../database/schema.js";
import { log } from "@repo/logger";
import { type QuarterlyEpsData } from "@repo/dto";

// Re-export the type for use by the service layer
export type { QuarterlyEpsData } from "@repo/dto";

/**
 * Converts YYYY-QN format to SQL-compatible date YYYY-MM-01.
 * Q1 → 01, Q2 → 04, Q3 → 07, Q4 → 10
 * @param quarterDate - Date in YYYY-QN format (e.g., "2024-Q1")
 * @returns SQL date string (e.g., "2024-01-01")
 */
function quarterToSqlDate(quarterDate: string): string {
  const match = quarterDate.match(/^(\d{4})-Q([1-4])$/);
  if (!match) {
    throw new Error(`Invalid quarter date format: ${quarterDate}`);
  }
  const year = match[1];
  const quarter = parseInt(match[2], 10);
  // Map quarter to first month: Q1→01, Q2→04, Q3→07, Q4→10
  const month = String((quarter - 1) * 3 + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/**
 * Retrieves quarterly EPS records from the database for a given quarter.
 * @param date - Quarter date in YYYY-QN format (e.g., "2024-Q1")
 * @returns Array of QuarterlyEpsData records
 */
export async function getQuarterlyEpsByDate(
  date: string
): Promise<QuarterlyEpsData[]> {
  // Convert YYYY-QN format to SQL date format YYYY-MM-01
  const storageDate = quarterToSqlDate(date);

  try {
    const records = await db
      .select({
        code: stocks.code,
        name: stocks.name,
        eps: quarterlyEps.eps,
      })
      .from(quarterlyEps)
      .innerJoin(stocks, eq(quarterlyEps.stockCode, stocks.code))
      .where(eq(quarterlyEps.date, storageDate));

    // Map database records to interface format
    return records.map((record) => ({
      code: record.code,
      name: record.name,
      eps: Number(record.eps),
    }));
  } catch (error) {
    log(
      `[QuarterlyEpsModel] Error fetching EPS data: ${(error as Error).message}`
    );
    return [];
  }
}

/**
 * Saves quarterly EPS data to the database with upsert logic.
 * @param data - Array of QuarterlyEpsData to save
 * @param date - Quarter date in YYYY-QN format (e.g., "2024-Q1")
 */
export async function saveQuarterlyEps(
  data: QuarterlyEpsData[],
  date: string
): Promise<void> {
  if (data.length === 0) return;

  // Convert YYYY-QN format to SQL date format YYYY-MM-01
  const storageDate = quarterToSqlDate(date);

  try {
    // 1. Upsert Stocks - ensure all referenced stocks exist
    const uniqueStocks = new Map<string, { code: string; name: string }>();
    data.forEach((item) => {
      uniqueStocks.set(item.code, { code: item.code, name: item.name });
    });
    const stocksValues = Array.from(uniqueStocks.values());

    await db
      .insert(stocks)
      .values(stocksValues)
      .onDuplicateKeyUpdate({ set: { name: sql`VALUES(name)` } });

    // 2. Upsert EPS records
    const epsValues = data.map((item) => ({
      stockCode: item.code,
      date: storageDate,
      eps: item.eps.toString(),
    }));

    await db
      .insert(quarterlyEps)
      .values(epsValues)
      .onDuplicateKeyUpdate({
        set: {
          eps: sql`VALUES(eps)`,
        },
      });

    log(`[QuarterlyEpsModel] Saved ${data.length} EPS records for ${date}`);
  } catch (error) {
    log(`[QuarterlyEpsModel] Error saving data: ${(error as Error).message}`);
    throw error;
  }
}
