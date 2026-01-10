import {
  mysqlTable,
  varchar,
  date,
  decimal,
  bigint,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// 1. Stocks Table
export const stocks = mysqlTable("stocks", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

// 2. Daily Prices Table
export const dailyPrices = mysqlTable(
  "daily_prices",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    stockCode: varchar("stock_code", { length: 20 })
      .notNull()
      .references(() => stocks.code, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    date: date("date", { mode: "string" }).notNull(),
    open: decimal("open", { precision: 10, scale: 2 }).notNull(),
    high: decimal("high", { precision: 10, scale: 2 }).notNull(),
    low: decimal("low", { precision: 10, scale: 2 }).notNull(),
    close: decimal("close", { precision: 10, scale: 2 }).notNull(),
    volume: bigint("volume", { mode: "number" }).notNull(),
  },
  (table) => [uniqueIndex("daily_prices_idx").on(table.stockCode, table.date)]
);

// 3. Monthly Revenues Table
export const monthlyRevenues = mysqlTable(
  "monthly_revenues",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    stockCode: varchar("stock_code", { length: 20 })
      .notNull()
      .references(() => stocks.code, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    date: date("date", { mode: "string" }).notNull(), // Stored as YYYY-MM-01
    monthlyRevenue: decimal("monthly_revenue", {
      precision: 20,
      scale: 2,
    }).notNull(), // Large numbers
    lastMonthRevenue: decimal("last_month_revenue", {
      precision: 20,
      scale: 2,
    }).notNull(),
    lastYearMonthlyRevenue: decimal("last_year_monthly_revenue", {
      precision: 20,
      scale: 2,
    }).notNull(),
    previousMonthChangePercent: decimal("previous_month_change_percent", {
      precision: 10,
      scale: 2,
    }).notNull(),
    lastYearSameMonthChangePercent: decimal(
      "last_year_same_month_change_percent",
      {
        precision: 10,
        scale: 2,
      }
    ).notNull(),
    cumulativeRevenue: decimal("cumulative_revenue", {
      precision: 20,
      scale: 2,
    }).notNull(),
    lastYearCumulativeRevenue: decimal("last_year_cumulative_revenue", {
      precision: 20,
      scale: 2,
    }).notNull(),
    cumulativePreviousPeriodChangePercent: decimal(
      "cumulative_previous_period_change_percent",
      {
        precision: 10,
        scale: 2,
      }
    ).notNull(),
    remarks: varchar("remarks", { length: 255 }),
  },
  (table) => [
    uniqueIndex("monthly_revenues_idx").on(table.stockCode, table.date),
  ]
);

// 4. Quarterly EPS Table
// Stores earnings per share data for each company by quarter
export const quarterlyEps = mysqlTable(
  "quarterly_eps",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    stockCode: varchar("stock_code", { length: 20 })
      .notNull()
      .references(() => stocks.code, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    // Stored as YYYY-MM-01 format (first day of the quarter's first month)
    date: date("date", { mode: "string" }).notNull(),
    // Basic EPS with precision for decimal values (e.g., 0.78, -1.23)
    eps: decimal("eps", { precision: 10, scale: 4 }).notNull(),
  },
  (table) => [uniqueIndex("quarterly_eps_idx").on(table.stockCode, table.date)]
);

// 5. Quarterly Capital Table
// Stores paid-in capital (股本) data for each company by quarter
export const quarterlyCapital = mysqlTable(
  "quarterly_capital",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    stockCode: varchar("stock_code", { length: 20 })
      .notNull()
      .references(() => stocks.code, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    // Stored as YYYY-MM-01 format (first day of the quarter's first month)
    date: date("date", { mode: "string" }).notNull(),
    // Capital in TWD (large numbers, no decimals needed for capital)
    capital: decimal("capital", { precision: 20, scale: 0 }).notNull(),
  },
  (table) => [
    uniqueIndex("quarterly_capital_idx").on(table.stockCode, table.date),
  ]
);
