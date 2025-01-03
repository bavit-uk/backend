import { productService } from "@/services";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { transformProductData } from "@/utils/transformProductData.util";

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
    } catch (error: any) {
      console.error("Error creating draft product:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error creating draft product",
      });
    }
  },

  updateDraftProduct: async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      console.log("productId in controller", productId);

      const { stepData } = req.body;

      if (!mongoose.isValidObjectId(productId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid or missing 'productId'",
        });
      }

      if (!stepData || typeof stepData !== "object") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid or missing 'stepData' in request payload",
        });
      }

      const updatedProduct = await productService.updateDraftProduct(
        productId,
        stepData
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Draft product updated successfully",
        data: updatedProduct,
      });
    } catch (error: any) {
      console.error("Error updating draft product:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error updating draft product",
      });
    }
  },

  getAllProduct: async (_req: Request, res: Response) => {
    try {
      const products = await productService.getAllProducts();
      return res.status(StatusCodes.OK).json({
        success: true,
        products,
      });
    } catch (error: any) {
      console.error("Error fetching products:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error fetching products",
      });
    }
  },

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
    } catch (error: any) {
      console.error("Error fetching product by ID:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error fetching product",
      });
    }
  },
  transformAndSendProduct: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      if (!mongoose.isValidObjectId(id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid product ID",
        });
      }
  
      // Fetch product from DB
      const product = await productService.getFullProductById(id);
  
      if (!product) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Product not found",
        });
      }
  
      // Transform product using utility
      const transformedProduct = transformProductData(product);
  
      // Send transformed product as response
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Product transformed successfully",
        data: transformedProduct,
      });
    } catch (error: any) {
      console.error("Error transforming product:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error transforming product",
      });
    }
  },
  

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
    } catch (error: any) {
      console.error("Error updating product:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error updating product",
      });
    }
  },

  deleteProduct: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await productService.deleteProduct(id);
      res.status(StatusCodes.OK).json({ success: true, message: "Product deleted successfully", deletedProduct: result });
    } catch (error) {
      console.error("Delete Product Error:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error deleting product" });
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
    } catch (error: any) {
      console.error("Error toggling block status:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error toggling block status",
      });
    }
  },
};
