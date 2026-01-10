import type { Request, Response, RequestHandler } from "express";
import expressAsyncHandler from "express-async-handler";
import { z } from "zod";
import { fetchMonthlyRevenues } from "../services/MonthlyRevenue.service.js";

// Define the schema for route parameters
// Format: YYYY-MM
const MonthlyRevenueParamsSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Invalid date format. Expected YYYY-MM"),
});

export const getMonthlyRevenueController: RequestHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    // Validate req.params against the schema
    const result = MonthlyRevenueParamsSchema.safeParse(req.params);

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
      const data = await fetchMonthlyRevenues(date);

      res.json({
        success: true,
        message: "Data fetched successfully!",
        count: data.length,
        data: data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  },
);
