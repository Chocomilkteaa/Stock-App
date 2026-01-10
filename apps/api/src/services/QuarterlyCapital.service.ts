import axios from "axios";
import { load } from "cheerio";
import { log } from "@repo/logger";
import {
  getQuarterlyCapitalByDate,
  saveQuarterlyCapital,
  type QuarterlyCapitalData,
} from "../models/QuarterlyCapital.model.js";
import { DataNotFoundException } from "../exceptions/DataNotFoundException.js";

// Column names to extract from the TWSE MOPS table (股本 = Paid-in Capital)
const TARGET_COLUMNS = ["公司代號", "公司名稱", "股本"];

/**
 * Fetches quarterly capital data from TWSE MOPS for a specific market type.
 * Source: ajax_t163sb05 (Balance Sheet summary with capital info)
 * @param year - ROC year (民國年, e.g., 113 for 2024)
 * @param season - Quarter number (1-4)
 * @param type - Market type: "sii" for listed stocks, "otc" for OTC stocks
 * @returns Array of parsed capital data
 */
async function fetchFromSource(
  year: number,
  season: number,
  type: "sii" | "otc"
): Promise<QuarterlyCapitalData[]> {
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

  const url = "https://mopsov.twse.com.tw/mops/web/ajax_t163sb05";
  log(`[QuarterlyCapitalService] Fetching ${type.toUpperCase()}: ${url}`);

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
      `[QuarterlyCapitalService] Successfully fetched ${type.toUpperCase()} data`
    );
    return parseData(response.data);
  } catch (error) {
    log(
      `[QuarterlyCapitalService] Fetch ${type} error: ${(error as Error).message}`
    );
    return [];
  }
}

/**
 * Parses HTML response from MOPS to extract capital data.
 * @param html - Raw HTML string from MOPS response
 * @returns Array of parsed QuarterlyCapitalData
 */
function parseData(html: string): QuarterlyCapitalData[] {
  const $ = load(html);
  const rows: QuarterlyCapitalData[] = [];

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
        const capitalRaw = cells.eq(columnIndices[2]).text().trim();

        // Parse capital value, handling comma formatting (e.g., "1,234,567,890")
        const capital = parseInt(capitalRaw.replace(/,/g, ""), 10);

        // Only add valid rows
        if (code && name && !isNaN(capital)) {
          rows.push({ code, name, capital });
        }
      });
  });

  return rows;
}

/**
 * Main service function to fetch quarterly capital data.
 * Implements caching: checks database first, crawls if not found.
 * @param dateStr - Date string in YYYY-QN format (e.g., "2024-Q1")
 * @returns Array of QuarterlyCapitalData
 */
export async function fetchQuarterlyCapital(
  dateStr: string
): Promise<QuarterlyCapitalData[]> {
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
  const existingData = await getQuarterlyCapitalByDate(quarterDate);
  if (existingData.length > 0) {
    log(
      `[QuarterlyCapitalService] Check DB: Found ${existingData.length} records.`
    );
    return existingData;
  }

  // 2. Crawl from MOPS
  log(
    `[QuarterlyCapitalService] Check DB: No data. Starting crawl job for ${quarterDate}`
  );

  // Fetch data from both market types concurrently
  const [siiData, otcData] = await Promise.all([
    fetchFromSource(year, season, "sii"),
    fetchFromSource(year, season, "otc"),
  ]);

  log(
    `[QuarterlyCapitalService] Crawl Summary: ${siiData.length} SII items, ${otcData.length} OTC items.`
  );

  const allData = [...siiData, ...otcData];

  // Throw exception if no data found from any source
  if (allData.length === 0) {
    log(`[QuarterlyCapitalService] No data found from sources.`);
    throw new DataNotFoundException(
      `No quarterly capital data found for ${quarterDate}. The data may not be available yet or the quarter is invalid.`
    );
  }

  // 3. Save to DB for future requests
  await saveQuarterlyCapital(allData, quarterDate);

  return allData;
}
