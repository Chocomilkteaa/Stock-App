import { mysqlTable, varchar, date, decimal, bigint, uniqueIndex } from 'drizzle-orm/mysql-core';

// 1. Stocks Table
export const stocks = mysqlTable('stocks', {
  id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
  code: varchar('code', { length: 20 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});

// 2. Daily Prices Table
export const dailyPrices = mysqlTable(
  'daily_prices',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    stockCode: varchar('stock_code', { length: 20 })
      .notNull()
      .references(() => stocks.code, { onDelete: 'cascade', onUpdate: 'cascade' }),
    date: date('date', { mode: 'string' }).notNull(),
    open: decimal('open', { precision: 10, scale: 2 }).notNull(),
    high: decimal('high', { precision: 10, scale: 2 }).notNull(),
    low: decimal('low', { precision: 10, scale: 2 }).notNull(),
    close: decimal('close', { precision: 10, scale: 2 }).notNull(),
    volume: bigint('volume', { mode: 'number' }).notNull(),
  },
  (table) => [uniqueIndex('daily_prices_idx').on(table.stockCode, table.date)]
);
