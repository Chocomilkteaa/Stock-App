import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "stock_db",
});

export const db = drizzle(poolConnection);
