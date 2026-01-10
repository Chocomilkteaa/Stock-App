import axios from "axios";
import { load } from "cheerio";
import { log } from "@repo/logger";
import {
  getQuarterlyEpsByDate,
  saveQuarterlyEps,
  type QuarterlyEpsData,
} from "../models/QuarterlyEPS.model.js";

// Column names to extract from the TWSE MOPS table
const TARGET_COLUMNS = ["公司代號", "公司名稱", "基本每股盈餘（元）"];

/**
 * Fetches quarterly EPS data from TWSE MOPS for a specific market type.
 * @param year - ROC year (民國年, e.g., 113 for 2024)
 * @param season - Quarter number (1-4)
 * @param type - Market type: "sii" for listed stocks, "otc" for OTC stocks
 * @returns Array of parsed EPS data
 */
async function fetchFromSource(
  year: number,
  season: number,
  type: "sii" | "otc"
): Promise<QuarterlyEpsData[]> {
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

  const url = "https://mopsov.twse.com.tw/mops/web/ajax_t163sb04";
  log(`[QuarterlyEpsService] Fetching ${type.toUpperCase()}: ${url}`);

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
      `[QuarterlyEpsService] Successfully fetched ${type.toUpperCase()} data`
    );
    return parseData(response.data);
  } catch (error) {
    log(
      `[QuarterlyEpsService] Fetch ${type} error: ${(error as Error).message}`
    );
    return [];
  }
}

/**
 * Parses HTML response from MOPS to extract EPS data.
 * @param html - Raw HTML string from MOPS response
 * @returns Array of parsed QuarterlyEpsData
 */
function parseData(html: string): QuarterlyEpsData[] {
  const $ = load(html);
  const rows: QuarterlyEpsData[] = [];

  // Find all tables with class "hasBorder" (data tables)
  $("table.hasBorder").each((_, table) => {
    // Get column indices by matching header text
    const headers = $(table).find("tr.tblHead th");
    const columnIndices = TARGET_COLUMNS.map((name) =>
      headers.toArray().findIndex((header) => $(header).text().trim() === name)
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
        const code = cells.eq(columnIndices[0]).text().trim();
        const name = cells.eq(columnIndices[1]).text().trim();
        const epsRaw = cells.eq(columnIndices[2]).text().trim();

        // Parse EPS value, handling potential formatting issues
        const eps = parseFloat(epsRaw.replace(/,/g, ""));

        // Only add valid rows
        if (code && name && !isNaN(eps)) {
          rows.push({ code, name, eps });
        }
      });
  });

  return rows;
}

/**
 * Main service function to fetch quarterly EPS data.
 * Implements caching: checks database first, crawls if not found.
 * @param dateStr - Date string in YYYY-QN format (e.g., "2024-Q1")
 * @returns Array of QuarterlyEpsData
 */
export async function fetchQuarterlyEps(
  dateStr: string
): Promise<QuarterlyEpsData[]> {
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
  const existingData = await getQuarterlyEpsByDate(quarterDate);
  if (existingData.length > 0) {
    log(
      `[QuarterlyEpsService] Check DB: Found ${existingData.length} records.`
    );
    return existingData;
  }

  // 2. Crawl from MOPS
  log(
    `[QuarterlyEpsService] Check DB: No data. Starting crawl job for ${quarterDate}`
  );

  // Fetch data from both market types concurrently
  const [siiData, otcData] = await Promise.all([
    fetchFromSource(year, season, "sii"),
    fetchFromSource(year, season, "otc"),
  ]);

  log(
    `[QuarterlyEpsService] Crawl Summary: ${siiData.length} SII items, ${otcData.length} OTC items.`
  );

  const allData = [...siiData, ...otcData];

  if (allData.length === 0) {
    log(`[QuarterlyEpsService] No data found from sources.`);
    return [];
  }

  // 3. Save to DB for future requests
  await saveQuarterlyEps(allData, quarterDate);

  return allData;
}
