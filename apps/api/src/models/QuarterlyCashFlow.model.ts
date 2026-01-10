import { eq, sql } from "drizzle-orm";
import { db } from "../database/db.js";
import { quarterlyCashFlow, stocks } from "../database/schema.js";
import { log } from "@repo/logger";
import { type QuarterlyCashFlowData } from "@repo/dto";

// Re-export the type for use by the service layer
export type { QuarterlyCashFlowData } from "@repo/dto";

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
 * Retrieves quarterly cash flow records from the database for a given quarter.
 * @param date - Quarter date in YYYY-QN format (e.g., "2024-Q1")
 * @returns Array of QuarterlyCashFlowData records
 */
export async function getQuarterlyCashFlowByDate(
  date: string
): Promise<QuarterlyCashFlowData[]> {
  // Convert YYYY-QN format to SQL date format YYYY-MM-01
  const storageDate = quarterToSqlDate(date);

  try {
    const records = await db
      .select({
        code: stocks.code,
        name: stocks.name,
        operatingCashFlow: quarterlyCashFlow.operatingCashFlow,
        investingCashFlow: quarterlyCashFlow.investingCashFlow,
        financingCashFlow: quarterlyCashFlow.financingCashFlow,
        exchangeRateEffect: quarterlyCashFlow.exchangeRateEffect,
        netCashChange: quarterlyCashFlow.netCashChange,
        beginningCashBalance: quarterlyCashFlow.beginningCashBalance,
        endingCashBalance: quarterlyCashFlow.endingCashBalance,
      })
      .from(quarterlyCashFlow)
      .innerJoin(stocks, eq(quarterlyCashFlow.stockCode, stocks.code))
      .where(eq(quarterlyCashFlow.date, storageDate));

    // Map database records to interface format (convert string decimals to numbers)
    return records.map((record) => ({
      code: record.code,
      name: record.name,
      operatingCashFlow: Number(record.operatingCashFlow),
      investingCashFlow: Number(record.investingCashFlow),
      financingCashFlow: Number(record.financingCashFlow),
      exchangeRateEffect: Number(record.exchangeRateEffect),
      netCashChange: Number(record.netCashChange),
      beginningCashBalance: Number(record.beginningCashBalance),
      endingCashBalance: Number(record.endingCashBalance),
    }));
  } catch (error) {
    log(
      `[QuarterlyCashFlowModel] Error fetching cash flow data: ${(error as Error).message}`
    );
    return [];
  }
}

/**
 * Saves quarterly cash flow data to the database with upsert logic.
 * @param data - Array of QuarterlyCashFlowData to save
 * @param date - Quarter date in YYYY-QN format (e.g., "2024-Q1")
 */
export async function saveQuarterlyCashFlow(
  data: QuarterlyCashFlowData[],
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

    // 2. Upsert cash flow records
    const cashFlowValues = data.map((item) => ({
      stockCode: item.code,
      date: storageDate,
      operatingCashFlow: item.operatingCashFlow.toString(),
      investingCashFlow: item.investingCashFlow.toString(),
      financingCashFlow: item.financingCashFlow.toString(),
      exchangeRateEffect: item.exchangeRateEffect.toString(),
      netCashChange: item.netCashChange.toString(),
      beginningCashBalance: item.beginningCashBalance.toString(),
      endingCashBalance: item.endingCashBalance.toString(),
    }));

    await db
      .insert(quarterlyCashFlow)
      .values(cashFlowValues)
      .onDuplicateKeyUpdate({
        set: {
          operatingCashFlow: sql`VALUES(operating_cash_flow)`,
          investingCashFlow: sql`VALUES(investing_cash_flow)`,
          financingCashFlow: sql`VALUES(financing_cash_flow)`,
          exchangeRateEffect: sql`VALUES(exchange_rate_effect)`,
          netCashChange: sql`VALUES(net_cash_change)`,
          beginningCashBalance: sql`VALUES(beginning_cash_balance)`,
          endingCashBalance: sql`VALUES(ending_cash_balance)`,
        },
      });

    log(
      `[QuarterlyCashFlowModel] Saved ${data.length} cash flow records for ${date}`
    );
  } catch (error) {
    log(
      `[QuarterlyCashFlowModel] Error saving data: ${(error as Error).message}`
    );
    throw error;
  }
}
