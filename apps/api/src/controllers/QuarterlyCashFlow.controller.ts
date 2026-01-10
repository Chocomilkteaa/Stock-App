import type { Request, Response, RequestHandler } from "express";
import expressAsyncHandler from "express-async-handler";
import { z } from "zod";
import { fetchQuarterlyCashFlow } from "../services/QuarterlyCashFlow.service.js";
import { DataNotFoundException } from "../exceptions/DataNotFoundException.js";

// Schema for validating route parameters
// Expects date in YYYY-QN format (e.g., 2024-Q1, 2024-Q2, 2024-Q3, 2024-Q4)
const QuarterlyCashFlowParamsSchema = z.object({
  date: z
    .string()
    .regex(
      /^\d{4}-Q[1-4]$/,
      "Invalid date format. Expected YYYY-QN (e.g., 2024-Q1)"
    ),
});

/**
 * Controller for fetching quarterly cash flow statement (現金流量表) data.
 * Route: GET /crawler/quarterly-cash-flow/:date
 *
 * @param date - Quarter string in YYYY-QN format (e.g., 2024-Q1)
 *               - Q1: First Quarter (Jan-Mar)
 *               - Q2: Second Quarter (Apr-Jun)
 *               - Q3: Third Quarter (Jul-Sep)
 *               - Q4: Fourth Quarter (Oct-Dec)
 */
export const getQuarterlyCashFlowController: RequestHandler =
  expressAsyncHandler(async (req: Request, res: Response) => {
    // Validate request parameters using Zod schema
    const result = QuarterlyCashFlowParamsSchema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation Error",
        error: result.error,
      });
      return;
    }

    const { date } = result.data;

    try {
      // Fetch data (from DB cache or crawl from MOPS)
      const data = await fetchQuarterlyCashFlow(date);

      res.json({
        success: true,
        message: "Data fetched successfully!",
        count: data.length,
        data: data,
      });
    } catch (error) {
      // Handle DataNotFoundException with 404 status
      if (error instanceof DataNotFoundException) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Handle other unexpected errors with 500 status
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  });
