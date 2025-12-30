import { Request, Response, RequestHandler } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { z } from 'zod';
import { DailyPriceService } from '../services/DailyPrice.service.js';

// Define the schema for route parameters
const CrawlerParamsSchema = z.object({
  date: z.iso.date(),
});

export const getDailyPriceController: RequestHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    // Validate req.params against the schema
    const result = CrawlerParamsSchema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'Validation Error',
        error: result.error,
      });
      return;
    }

    const { date } = result.data;

    try {
      const data = await DailyPriceService.fetchDailyPrices(date);

      res.json({
        success: true,
        message: 'Data fetched successfully!',
        count: data.length,
        data: data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
);
