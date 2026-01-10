import axios from "axios";
import { load } from "cheerio";
import { log } from "@repo/logger";
import {
  getMonthlyRevenuesByDate,
  saveMonthlyRevenues,
  type MonthlyRevenueData,
} from "../models/MonthlyRevenue.model.js";

const COLUMNS = [
  "code",
  "name",
  "monthlyRevenue",
  "lastMonthRevenue",
  "lastYearMonthlyRevenue",
  "previousMonthChangePercent",
  "lastYearSameMonthChangePercent",
  "cumulativeRevenue",
  "lastYearCumulativeRevenue",
  "cumulativePreviousPeriodChangePercent",
  "remarks",
] as const;

function parseData(decodedHtml: string): MonthlyRevenueData[] {
  const rows: MonthlyRevenueData[] = [];
  const $ = load(decodedHtml);

  // Helper to clean and parse numbers
  const parseNum = (val: string): number => {
    const clean = val.replace(/,/g, "").trim();
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  $("table[border=5]")
    .slice(0, -1)
    .each((_, table) => {
      $(table)
        .find("tr[align=right]")
        .slice(0, -1)
        .each((__, row) => {
          const rowObject: Partial<MonthlyRevenueData> = {};
          const tds = $(row).find("td");

          if (tds.length !== COLUMNS.length) return;

          // Map columns manually based on index order in COLUMNS constant
          // Use safe optional chaining or direct indexing since we checked length
          rowObject.code = $(tds[0]).text().trim();
          rowObject.name = $(tds[1]).text().trim();
          rowObject.monthlyRevenue = parseNum($(tds[2]).text());
          rowObject.lastMonthRevenue = parseNum($(tds[3]).text());
          rowObject.lastYearMonthlyRevenue = parseNum($(tds[4]).text());
          rowObject.previousMonthChangePercent = parseNum($(tds[5]).text());
          rowObject.lastYearSameMonthChangePercent = parseNum($(tds[6]).text());
          rowObject.cumulativeRevenue = parseNum($(tds[7]).text());
          rowObject.lastYearCumulativeRevenue = parseNum($(tds[8]).text());
          rowObject.cumulativePreviousPeriodChangePercent = parseNum(
            $(tds[9]).text(),
          );
          rowObject.remarks = $(tds[10]).text().trim() || null;

          if (rowObject.code && rowObject.name) {
            rows.push(rowObject as MonthlyRevenueData);
          }
        });
    });

  return rows;
}

async function fetchFromSource(
  year: number,
  month: number,
  type: "sii" | "otc",
): Promise<MonthlyRevenueData[]> {
  const url = `https://mopsov.twse.com.tw/nas/t21/${type}/t21sc03_${year}_${month}_0.html`;
  log(`[MonthlyRevenueService] Fetching ${type.toUpperCase()}: ${url}`);

  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    if (res.status !== 200) {
      throw new Error(`Status ${res.status}`);
    }

    const decoder = new TextDecoder("big5");
    const decodedHtml = decoder.decode(res.data);
    return parseData(decodedHtml);
  } catch (error) {
    log(
      `[MonthlyRevenueService] Fetch ${type} error: ${(error as Error).message}`,
    );
    return [];
  }
}

export async function fetchMonthlyRevenues(
  dateStr: string,
): Promise<MonthlyRevenueData[]> {
  // dateStr format: YYYY-MM
  // 1. Check DB
  const existingData = await getMonthlyRevenuesByDate(dateStr);
  if (existingData.length > 0) {
    log(
      `[MonthlyRevenueService] Check DB: Found ${existingData.length} records.`,
    );
    return existingData;
  }

  // 2. Crawl
  log(
    `[MonthlyRevenueService] Check DB: No data. Starting crawl job for ${dateStr}`,
  );
  const dateObj = new Date(dateStr + "-01"); // Append day to make it valid date
  // Calculate ROC year
  const rocYear = dateObj.getFullYear() - 1911;
  const month = dateObj.getMonth() + 1;

  const [siiData, otcData] = await Promise.all([
    fetchFromSource(rocYear, month, "sii"),
    fetchFromSource(rocYear, month, "otc"),
  ]);

  log(
    `[MonthlyRevenueService] Crawl Summary: ${siiData.length} SII items, ${otcData.length} OTC items.`,
  );

  const allData = [...siiData, ...otcData];

  if (allData.length === 0) {
    log(`[MonthlyRevenueService] No data found from sources.`);
    return [];
  }

  // 3. Save to DB
  await saveMonthlyRevenues(allData, dateStr);

  return allData;
}
