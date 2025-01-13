import { variationService } from "@/services";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { transformVariationData } from "@/utils/transformVariationData.util";

export const variationController = {
  createDraftVariation: async (req: Request, res: Response) => {
    try {
      const { stepData } = req.body;

      // console.log("stepData in controller : " , stepData)

      if (!stepData || typeof stepData !== "object") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid or missing 'stepData' in request payload",
        });
      }

      const draftVariation =
        await variationService.createDraftVariation(stepData);

      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Draft variation created successfully",
        data: { variationId: draftVariation._id },
      });
    } catch (error: any) {
      console.error("Error creating draft variation:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error creating draft variation",
      });
    }
  },

  updateDraftVariation: async (req: Request, res: Response) => {
    try {
      const variationId = req.params.id;
      const { stepData } = req.body;

      if (!mongoose.isValidObjectId(variationId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid or missing 'variationId'",
        });
      }

      if (!stepData || typeof stepData !== "object") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid or missing 'stepData' in request payload",
        });
      }

      // Call the service to update the draft variation with conditional updates based on discriminator
      const updatedVariation = await variationService.updateDraftVariation(
        variationId,
        stepData
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Draft variation updated successfully",
        data: updatedVariation,
      });
    } catch (error: any) {
      console.error("Error updating draft variation:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error updating draft variation",
      });
    }
  },

  getAllVariation: async (req: Request, res: Response) => {
    try {
      const variations = await variationService.getAllVariations();
      return res.status(StatusCodes.OK).json({
        success: true,
        variations,
      });
    } catch (error: any) {
      console.error("Error fetching variations:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error fetching variations",
      });
    }
  },

  getVariationById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // const platform = req.query.platform as "amazon" | "ebay" | "website";

      // if (!platform) {
      //   return res.status(StatusCodes.BAD_REQUEST).json({
      //     success: false,
      //     message: "Platform query parameter is required",
      //   });
      // }

      const variation = await variationService.getVariationById(id);

      if (!variation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Variation not found",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        variation,
      });
    } catch (error: any) {
      console.error("Error fetching variation by ID:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error fetching variation",
      });
    }
  },

  transformAndSendVariation: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Validate variation ID
      if (!mongoose.isValidObjectId(id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid variation ID",
        });
      }

      // Fetch variation from DB
      const variation = await variationService.getFullVariationById(id);

      if (!variation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Variation not found",
        });
      }

      // Transform variation data using utility
      const transformedVariation = transformVariationData(variation);

      // Send transformed variation as response
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Variation transformed successfully",
        data: transformedVariation,
      });
    } catch (error: any) {
      console.error("Error transforming variation:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error transforming variation",
      });
    }
  },
  //Get All Template Variation Names
  getAllTemplateVariations: async (req: Request, res: Response) => {
    try {
      const templates = await variationService.getVariationsByCondition({
        isTemplate: true,
      });

      if (!templates.length) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "No templates found",
        });
      }

      const templateList = templates.map((template: any, index: any) => {
        const variationId = template._id;
        const kind = template.kind || "UNKNOWN";

        // Determine fields based on category (kind)
        let fields: string[] = [];
        const prodInfo: any =
          template.platformDetails.website?.prodTechInfo || {};

        switch (kind.toLowerCase()) {
          case "laptops":
            fields = [
              prodInfo.processor,
              prodInfo.model,
              prodInfo.ssdCapacity,
              prodInfo.hardDriveCapacity,
              prodInfo.manufacturerWarranty,
              prodInfo.operatingSystem,
            ];
            break;
          case "all in one pc":
            fields = [
              prodInfo.type,
              prodInfo.memory,
              prodInfo.processor,
              prodInfo.operatingSystem,
            ];
            break;
          case "projectors":
            fields = [prodInfo.type, prodInfo.model];
            break;
          case "monitors":
            fields = [prodInfo.screenSize, prodInfo.maxResolution];
            break;
          case "gaming pc":
            fields = [
              prodInfo.processor,
              prodInfo.gpu,
              prodInfo.operatingSystem,
            ];
            break;
          case "network equipments":
            fields = [prodInfo.networkType, prodInfo.processorType];
            break;
          default:
            fields = ["UNKNOWN"];
            break;
        }

        // Filter out undefined/null fields and join to form the name
        const fieldString = fields.filter(Boolean).join("-") || "UNKNOWN";

        const srno = (index + 1).toString().padStart(2, "0");

        const templateName = `${kind}-${fieldString}-${srno}`.toUpperCase();

        return { templateName, variationId };
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Templates fetched successfully",
        data: templateList,
      });
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error fetching templates",
      });
    }
  },
  //Selected Template Variation
  transformAndSendTemplateVariation: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Validate variation ID
      if (!mongoose.isValidObjectId(id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid template ID",
        });
      }

      // Fetch variation from DB
      const variation = await variationService.getFullVariationById(id);

      if (!variation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Variation not found",
        });
      }

      // Transform variation data using utility
      const transformedVariationTemplate = transformVariationData(variation);

      // Send transformed variation as response
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "template transformed and Fetched successfully",
        data: transformedVariationTemplate,
      });
    } catch (error: any) {
      console.error("Error transforming variation Template:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error transforming variation Template",
      });
    }
  },
  updateVariationById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { platform, data } = req.body;

      if (!platform || !data) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Platform and data are required to update the variation",
        });
      }

      const updatedVariation = await variationService.updateVariation(
        id,
        platform,
        data
      );

      if (!updatedVariation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Variation not found",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Variation updated successfully",
        data: updatedVariation,
      });
    } catch (error: any) {
      console.error("Error updating variation:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error updating variation",
      });
    }
  },

  deleteVariation: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await variationService.deleteVariation(id);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Variation deleted successfully",
        deletedVariation: result,
      });
    } catch (error) {
      console.error("Delete Variation Error:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error deleting variation" });
    }
  },

  toggleBlock: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isBlocked } = req.body;

      if (typeof isBlocked !== "boolean") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "isBlocked must be a boolean value",
        });
      }

      const updatedVariation = await variationService.toggleBlock(
        id,
        isBlocked
      );

      if (!updatedVariation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Variation not found",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: `Variation ${isBlocked ? "blocked" : "unblocked"} successfully`,
        data: updatedVariation,
      });
    } catch (error: any) {
      console.error("Error toggling block status:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error toggling block status",
      });
    }
  },
};
