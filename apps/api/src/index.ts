import "./config/env.js"; // Must be first to ensure env vars are loaded before other imports
import express from "express";
import cors from "cors";

import { db } from "./database/db.js";
import { getDailyPriceController } from "./controllers/DailyPrice.controller.js";
import { getMonthlyRevenueController } from "./controllers/MonthlyRevenue.controller.js";
import { getQuarterlyEpsController } from "./controllers/QuarterlyEPS.controller.js";
import { getQuarterlyCapitalController } from "./controllers/QuarterlyCapital.controller.js";
import { getQuarterlyCashFlowController } from "./controllers/QuarterlyCashFlow.controller.js";
import { log } from "@repo/logger";

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await db.execute("SELECT 1");
  } catch (err) {
    log(
      `[Health] Database Error: ${err instanceof Error ? err.message : String(err)}`,
    );
    res.status(500).json({ success: false, message: (err as Error).message });
    return;
  }

  res.json({ success: true, message: "API is running" });
});

app.get("/crawler/daily-prices/:date", getDailyPriceController);
app.get("/crawler/monthly-revenues/:date", getMonthlyRevenueController);
app.get("/crawler/quarterly-eps/:date", getQuarterlyEpsController);
app.get("/crawler/quarterly-capital/:date", getQuarterlyCapitalController);
app.get("/crawler/quarterly-cash-flow/:date", getQuarterlyCashFlowController);

app.listen(port, () => {
  log(`API running at http://localhost:${port}`);
});
