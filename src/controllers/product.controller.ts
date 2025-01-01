import { productService } from "@/services";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

export const productController = {
  createDraftProduct: async (req: Request, res: Response) => {
    try {
      const { stepData } = req.body;

      if (!stepData || typeof stepData !== "object") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid or missing 'stepData' in request payload",
        });
      }

      const draftProduct = await productService.createDraftProduct(stepData);

      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Draft product created successfully",
        data: { productId: draftProduct._id },
      });
    } catch (error) {
      console.error("Error creating draft product:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error creating draft product",
      });
    }
  },

  // Handle subsequent steps to update the draft product
  updateDraftProduct: async (req: Request, res: Response) => {
    try {
      const { productId } = req.body;
      const { stepData } = req.body;

      console.log(  "productId : ",productId)
      console.log(  "stepData : ",stepData)

      // Validate productId
      if (!mongoose.isValidObjectId(productId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid or missing 'productId'",
        });
      }

      // Validate stepData
      if (!stepData || typeof stepData !== "object") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid or missing 'stepData' in request payload",
        });
      }

      // Call service to update draft product
      const updatedProduct = await productService.updateDraftProduct(
        productId,
        stepData
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Draft product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating draft product:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error updating draft product",
      });
    }
  },
  // Get all products
  getAllProduct: async (_req: Request, res: Response) => {
    try {
      const products = await productService.getAllProducts();

      return res.status(StatusCodes.OK).json({
        success: true,
        products,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error fetching products",
      });
    }
  },

  // Get a product by ID for a specific platform
  getProductById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const platform = req.query.platform as "amazon" | "ebay" | "website";

      if (!platform) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Platform query parameter is required",
        });
      }

      const product = await productService.getProductById(id, platform);

      if (!product) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error fetching product",
      });
    }
  },

  // Update product by ID
  updateProductById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { platform, data } = req.body;

      if (!platform || !data) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Platform and data are required to update the product",
        });
      }

      const updatedProduct = await productService.updateProduct(
        id,
        platform,
        data
      );

      if (!updatedProduct) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error updating product",
      });
    }
  },

  // Toggle block status for a product
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

      const updatedProduct = await productService.toggleBlock(id, isBlocked);

      if (!updatedProduct) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: `Product ${isBlocked ? "blocked" : "unblocked"} successfully`,
        data: updatedProduct,
      });
    } catch (error) {
      console.error("Error toggling block status:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error toggling block status",
      });
    }
  },
};
