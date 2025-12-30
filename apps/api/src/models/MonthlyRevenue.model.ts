import { eq, sql } from 'drizzle-orm';
import { db } from '../database/db.js';
import { monthlyRevenues, stocks } from '../database/schema.js';
import { log } from '@repo/logger';

export interface MonthlyRevenueData {
  code: string;
  name: string;
  monthlyRevenue: number;
  lastMonthRevenue: number;
  lastYearMonthlyRevenue: number;
  previousMonthChangePercent: number;
  lastYearSameMonthChangePercent: number;
  cumulativeRevenue: number;
  lastYearCumulativeRevenue: number;
  cumulativePreviousPeriodChangePercent: number;
  remarks: string | null;
}

export class MonthlyRevenueModel {
  static async getMonthlyRevenuesByDate(date: string): Promise<MonthlyRevenueData[]> {
    // date input is YYYY-MM. We store as YYYY-MM-01.
    const storageDate = `${date}-01`;
    try {
      const records = await db
        .select({
          code: stocks.code,
          name: stocks.name,
          monthlyRevenue: monthlyRevenues.monthlyRevenue,
          lastMonthRevenue: monthlyRevenues.lastMonthRevenue,
          lastYearMonthlyRevenue: monthlyRevenues.lastYearMonthlyRevenue,
          previousMonthChangePercent: monthlyRevenues.previousMonthChangePercent,
          lastYearSameMonthChangePercent: monthlyRevenues.lastYearSameMonthChangePercent,
          cumulativeRevenue: monthlyRevenues.cumulativeRevenue,
          lastYearCumulativeRevenue: monthlyRevenues.lastYearCumulativeRevenue,
          cumulativePreviousPeriodChangePercent:
            monthlyRevenues.cumulativePreviousPeriodChangePercent,
          remarks: monthlyRevenues.remarks,
        })
        .from(monthlyRevenues)
        .innerJoin(stocks, eq(monthlyRevenues.stockCode, stocks.code))
        .where(eq(monthlyRevenues.date, storageDate));

      return records.map((record) => ({
        code: record.code,
        name: record.name,
        date: date, // Return as YYYY-MM
        monthlyRevenue: Number(record.monthlyRevenue),
        lastMonthRevenue: Number(record.lastMonthRevenue),
        lastYearMonthlyRevenue: Number(record.lastYearMonthlyRevenue),
        previousMonthChangePercent: Number(record.previousMonthChangePercent),
        lastYearSameMonthChangePercent: Number(record.lastYearSameMonthChangePercent),
        cumulativeRevenue: Number(record.cumulativeRevenue),
        lastYearCumulativeRevenue: Number(record.lastYearCumulativeRevenue),
        cumulativePreviousPeriodChangePercent: Number(record.cumulativePreviousPeriodChangePercent),
        remarks: record.remarks,
      }));
    } catch (error) {
      log(`[MonthlyRevenueModel] Error fetching revenues: ${(error as Error).message}`);
      return [];
    }
  }

  static async saveMonthlyRevenues(data: MonthlyRevenueData[], date: string): Promise<void> {
    if (data.length === 0) return;

    const storageDate = `${date}-01`;

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

      // 2. Upsert Revenues
      const revenuesValues = data.map((item) => ({
        stockCode: item.code,
        date: storageDate,
        monthlyRevenue: item.monthlyRevenue.toString(),
        lastMonthRevenue: item.lastMonthRevenue.toString(),
        lastYearMonthlyRevenue: item.lastYearMonthlyRevenue.toString(),
        previousMonthChangePercent: item.previousMonthChangePercent.toString(),
        lastYearSameMonthChangePercent: item.lastYearSameMonthChangePercent.toString(),
        cumulativeRevenue: item.cumulativeRevenue.toString(),
        lastYearCumulativeRevenue: item.lastYearCumulativeRevenue.toString(),
        cumulativePreviousPeriodChangePercent:
          item.cumulativePreviousPeriodChangePercent.toString(),
        remarks: item.remarks,
      }));

      await db
        .insert(monthlyRevenues)
        .values(revenuesValues)
        .onDuplicateKeyUpdate({
          set: {
            monthlyRevenue: sql`VALUES(monthly_revenue)`,
            lastMonthRevenue: sql`VALUES(last_month_revenue)`,
            lastYearMonthlyRevenue: sql`VALUES(last_year_monthly_revenue)`,
            previousMonthChangePercent: sql`VALUES(previous_month_change_percent)`,
            lastYearSameMonthChangePercent: sql`VALUES(last_year_same_month_change_percent)`,
            cumulativeRevenue: sql`VALUES(cumulative_revenue)`,
            lastYearCumulativeRevenue: sql`VALUES(last_year_cumulative_revenue)`,
            cumulativePreviousPeriodChangePercent: sql`VALUES(cumulative_previous_period_change_percent)`,
            remarks: sql`VALUES(remarks)`,
          },
        });

      log(`[MonthlyRevenueModel] Saved ${data.length} records for ${date}`);
    } catch (error) {
      log(`[MonthlyRevenueModel] Error saving data: ${(error as Error).message}`);
      throw error;
    }
  }
}
