import { eq, sql } from "drizzle-orm";
import { db } from "../database/db.js";
import { dailyPrices, stocks } from "../database/schema.js";
import type { DailyPriceData } from "@repo/dto";
import { log } from "@repo/logger";

export async function getDailyPricesByDate(
  date: string
): Promise<DailyPriceData[]> {
  try {
    const records = await db
      .select({
        code: stocks.code,
        name: stocks.name,
        open: dailyPrices.open,
        high: dailyPrices.high,
        low: dailyPrices.low,
        close: dailyPrices.close,
        volume: dailyPrices.volume,
      })
      .from(dailyPrices)
      .innerJoin(stocks, eq(dailyPrices.stockCode, stocks.code))
      .where(eq(dailyPrices.date, date));

    return records.map((record) => ({
      code: record.code,
      name: record.name,
      open: Number(record.open),
      high: Number(record.high),
      low: Number(record.low),
      close: Number(record.close),
      volume: Number(record.volume),
    }));
  } catch (error) {
    log(`[DailyPriceModel] Error fetching prices: ${(error as Error).message}`);
    return [];
  }
}

export async function saveStocksAndPrices(
  data: DailyPriceData[],
  date: string
): Promise<void> {
  if (data.length === 0) return;

  try {
    // 1. Upsert Stocks
    const uniqueStocks = new Map();
    data.forEach((item) => {
      uniqueStocks.set(item.code, { code: item.code, name: item.name });
    });
    const stocksValues = Array.from(uniqueStocks.values());

    await db
      .insert(stocks)
      .values(stocksValues)
      .onDuplicateKeyUpdate({ set: { name: sql`VALUES(name)` } });

    // 2. Upsert Prices
    const pricesValues = data.map((item) => ({
      stockCode: item.code,
      date: date,
      open: item.open.toString(),
      high: item.high.toString(),
      low: item.low.toString(),
      close: item.close.toString(),
      volume: item.volume,
    }));

    await db
      .insert(dailyPrices)
      .values(pricesValues)
      .onDuplicateKeyUpdate({
        set: {
          open: sql`VALUES(open)`,
          high: sql`VALUES(high)`,
          low: sql`VALUES(low)`,
          close: sql`VALUES(close)`,
          volume: sql`VALUES(volume)`,
        },
      });

    log(`[DailyPriceModel] Saved ${data.length} records for ${date}`);
  } catch (error) {
    log(`[DailyPriceModel] Error saving data: ${(error as Error).message}`);
    throw error;
  }
}
