// /controllers/variation.controller.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { variationService } from "@/services/variation.service";
import {
  AmazonVariation,
  EbayVariation,
  WebsiteVariation,
} from "@/models/variation.model";
export const variationController = {
  //get platform specific variation
  getPartsByPlatform: async (req: Request, res: Response) => {
    try {
      const { platform } = req.params;

      if (!platform) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Platform is required",
        });
      }

      const parts = await variationService.getPartsByPlatform(platform);

      res.status(StatusCodes.OK).json({
        success: true,
        message: `Parts fetched successfully for platform: ${platform}`,
        data: parts,
      });
    } catch (error: any) {
      console.error("Error fetching parts:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error fetching parts",
      });
    }
  },

  getAllVariations: async (_req: Request, res: Response) => {
    try {
      // Fetch all variations from Amazon, eBay, and Website schemas
      const [amazonVariations, ebayVariations, websiteVariations] =
        await Promise.all([
          AmazonVariation.find({}),
          EbayVariation.find({}),
          WebsiteVariation.find({}),
        ]);

      // Combine variations in a structured response
      const allVariations = {
        amazon: amazonVariations,
        ebay: ebayVariations,
        website: websiteVariations,
      };

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Fetched all variations successfully",
        data: allVariations,
      });
    } catch (error) {
      console.error("Error fetching variations:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error fetching variations",
      });
    }
  },
};
