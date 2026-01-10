import axios from "axios";
import { load } from "cheerio";
import { log } from "@repo/logger";
import {
  getQuarterlyCashFlowByDate,
  saveQuarterlyCashFlow,
  type QuarterlyCashFlowData,
} from "../models/QuarterlyCashFlow.model.js";
import { DataNotFoundException } from "../exceptions/DataNotFoundException.js";

// Column names to extract from the TWSE MOPS table (現金流量表)
// These are the target column headers in the HTML table
const TARGET_COLUMNS = [
  "公司代號",
  "公司名稱",
  "營業活動之淨現金流入（流出）",
  "投資活動之淨現金流入（流出）",
  "籌資活動之淨現金流入（流出）",
  "匯率變動對現金及約當現金之影響",
  "本期現金及約當現金增加（減少）數",
  "期初現金及約當現金餘額",
  "期末現金及約當現金餘額",
];

/**
 * Fetches quarterly cash flow data from TWSE MOPS for a specific market type.
 * Source: ajax_t163sb20 (Cash Flow Statement - 現金流量表)
 * @param year - ROC year (民國年, e.g., 113 for 2024)
 * @param season - Quarter number (1-4)
 * @param type - Market type: "sii" for listed stocks, "otc" for OTC stocks
 * @returns Array of parsed cash flow data
 */
async function fetchFromSource(
  year: number,
  season: number,
  type: "sii" | "otc",
): Promise<QuarterlyCashFlowData[]> {
  // Build form data for POST request
  const data = new URLSearchParams({
    encodeURIComponent: "1",
    step: "1",
    firstin: "1",
    off: "1",
    isQuery: "Y",
    TYPEK: type,
    year: `${year}`,
    season: `0${season}`,
  });

  const url = "https://mopsov.twse.com.tw/mops/web/ajax_t163sb20";
  log(`[QuarterlyCashFlowService] Fetching ${type.toUpperCase()}: ${url}`);

  try {
    const response = await axios.post(url, data.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch: status code ${response.status}`);
    }

    log(
      `[QuarterlyCashFlowService] Successfully fetched ${type.toUpperCase()} data`,
    );
    return parseData(response.data);
  } catch (error) {
    log(
      `[QuarterlyCashFlowService] Fetch ${type} error: ${(error as Error).message}`,
    );
    return [];
  }
}

/**
 * Parses a numeric string from MOPS table, handling commas and parentheses for negatives.
 * Examples: "1,234,567" → 1234567, "(1,234)" → -1234, "-" → 0
 * @param value - Raw string value from table cell
 * @returns Parsed number (0 if unparseable)
 */
function parseNumber(value: string): number {
  // Handle empty or dash values as 0
  if (!value || value === "-" || value.trim() === "") {
    return 0;
  }

  // Check for negative values in parentheses format: (123,456)
  const isNegative = value.includes("(") && value.includes(")");

  // Remove all non-numeric characters except minus sign
  const cleanValue = value.replace(/[^0-9-]/g, "");
  const result = parseInt(cleanValue, 10);

  if (isNaN(result)) {
    return 0;
  }

  // Apply negative sign if value was in parentheses
  return isNegative ? -Math.abs(result) : result;
}

/**
 * Parses HTML response from MOPS to extract cash flow data.
 * @param html - Raw HTML string from MOPS response
 * @returns Array of parsed QuarterlyCashFlowData
 */
function parseData(html: string): QuarterlyCashFlowData[] {
  const $ = load(html);
  const rows: QuarterlyCashFlowData[] = [];

  // Find all tables with class "hasBorder" (data tables)
  $("table.hasBorder").each((_, table) => {
    // Get column indices by matching header text
    const headers = $(table).find("tr.tblHead th");
    const columnIndices = TARGET_COLUMNS.map((name) =>
      headers.toArray().findIndex((header) => $(header).text().trim() === name),
    );

    // Verify all required columns were found
    if (columnIndices.some((idx) => idx === -1)) {
      return; // Skip this table if missing required columns
    }

    // Extract data from each row (both even and odd styled rows)
    $(table)
      .find("tr.even, tr.odd")
      .each((_, row) => {
        const cells = $(row).find("td");

        // Extract text values from each target column
        const code = cells.eq(columnIndices[0]).text().trim();
        const name = cells.eq(columnIndices[1]).text().trim();
        const operatingCashFlow = parseNumber(
          cells.eq(columnIndices[2]).text().trim(),
        );
        const investingCashFlow = parseNumber(
          cells.eq(columnIndices[3]).text().trim(),
        );
        const financingCashFlow = parseNumber(
          cells.eq(columnIndices[4]).text().trim(),
        );
        const exchangeRateEffect = parseNumber(
          cells.eq(columnIndices[5]).text().trim(),
        );
        const netCashChange = parseNumber(
          cells.eq(columnIndices[6]).text().trim(),
        );
        const beginningCashBalance = parseNumber(
          cells.eq(columnIndices[7]).text().trim(),
        );
        const endingCashBalance = parseNumber(
          cells.eq(columnIndices[8]).text().trim(),
        );

        // Only add valid rows (must have code and name at minimum)
        if (code && name) {
          rows.push({
            code,
            name,
            operatingCashFlow,
            investingCashFlow,
            financingCashFlow,
            exchangeRateEffect,
            netCashChange,
            beginningCashBalance,
            endingCashBalance,
          });
        }
      });
  });

  return rows;
}

/**
 * Main service function to fetch quarterly cash flow data.
 * Implements caching: checks database first, crawls if not found.
 * @param dateStr - Date string in YYYY-QN format (e.g., "2024-Q1")
 * @returns Array of QuarterlyCashFlowData
 */
export async function fetchQuarterlyCashFlow(
  dateStr: string,
): Promise<QuarterlyCashFlowData[]> {
  // Parse YYYY-QN format (e.g., "2024-Q1")
  const match = dateStr.match(/^(\d{4})-Q([1-4])$/);
  if (!match) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-QN.`);
  }

  const gregorianYear = parseInt(match[1], 10);
  const season = parseInt(match[2], 10);
  const year = gregorianYear - 1911; // Convert to ROC year (民國年)

  // Use the input directly as quarter identifier for storage
  const quarterDate = dateStr;

  // 1. Check Database first (caching layer)
  const existingData = await getQuarterlyCashFlowByDate(quarterDate);
  if (existingData.length > 0) {
    log(
      `[QuarterlyCashFlowService] Check DB: Found ${existingData.length} records.`,
    );
    return existingData;
  }

  // 2. Crawl from MOPS
  log(
    `[QuarterlyCashFlowService] Check DB: No data. Starting crawl job for ${quarterDate}`,
  );

  // Fetch data from both market types concurrently
  const [siiData, otcData] = await Promise.all([
    fetchFromSource(year, season, "sii"),
    fetchFromSource(year, season, "otc"),
  ]);

  log(
    `[QuarterlyCashFlowService] Crawl Summary: ${siiData.length} SII items, ${otcData.length} OTC items.`,
  );

  const allData = [...siiData, ...otcData];

  // Throw exception if no data found from any source
  if (allData.length === 0) {
    log(`[QuarterlyCashFlowService] No data found from sources.`);
    throw new DataNotFoundException(
      `No quarterly cash flow data found for ${quarterDate}. The data may not be available yet or the quarter is invalid.`,
    );
  }

  // 3. Save to DB for future requests
  await saveQuarterlyCashFlow(allData, quarterDate);

  return allData;
}
