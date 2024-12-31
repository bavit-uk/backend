import { productService } from "@/services";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

export const productController = {
  // Add a new product
  addProduct: async (req: Request, res: Response) => {
    try {
      const { fields } = req.body;

      if (!fields || !Array.isArray(fields)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid or missing 'fields' in request payload",
        });
      }

      const platformDetails: any = {
        amazon: {},
        ebay: {},
        website: {},
      };

      // Iterate through fields and map values to their platforms
      for (const field of fields) {
        const { name, value, isAmz, isEbay, isWeb } = field;

        if (!name) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Field name is missing in the payload",
          });
        }

        // Convert productCategory value to ObjectId if applicable
        let processedValue = value;
        if (name === "productCategory") {
          if (mongoose.isValidObjectId(value)) {
            processedValue = new mongoose.Types.ObjectId(value);
          } else {
            return res.status(StatusCodes.BAD_REQUEST).json({
              success: false,
              message: `Invalid productCategory value: ${value}`,
            });
          }
        }

        // Map values to respective platforms
        if (isAmz) platformDetails.amazon[name] = processedValue;
        if (isEbay) platformDetails.ebay[name] = processedValue;
        if (isWeb) platformDetails.website[name] = processedValue;
      }

      // Create product with structured platformDetails
      const productData = {
        platformDetails,
        isBlocked: false,
        status: "draft",
      };

      const newProduct = await productService.addProduct(productData);

      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Product added successfully",
        data: newProduct,
      });
    } catch (error) {
      console.error("Error adding product:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error adding product",
      });
    }
  },
  addOrUpdateProductStep: async (req: Request, res: Response) => {
    try {
      const { fields } = req.body;

      if (!fields || !Array.isArray(fields)) {
        console.error("Invalid fields payload:", req.body);
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid or missing 'fields' in request payload",
        });
      }

      // Parse and structure platform-specific data
      const platformDetails: any = {
        amazon: {},
        ebay: {},
        website: {},
      };

      fields.forEach(({ name, value, isAmz, isEbay, isWeb }: any) => {
        if (isAmz) platformDetails.amazon[name] = value;
        if (isEbay) platformDetails.ebay[name] = value;
        if (isWeb) platformDetails.website[name] = value;
      });

      const productData = {
        platformDetails,
        isBlocked: false,
        status: "draft",
      };

      const newProduct = await productService.addProduct(productData);

      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Product added successfully",
        data: newProduct,
      });
    } catch (error) {
      console.error("Error adding/updating product step:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error adding/updating product step",
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
  // deleteProduct: async (req: Request, res: Response) => {
  //   try {
  //     const userId = req.params.id
  //     const product = await productService.deleteProduct(userId);
  //     res.status(StatusCodes.OK).json({ message: "Product deleted successfully" });
  //     if (!product) return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
  //   } catch (error) {
  //     console.error("Error deleting product:", error);
  //     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while deleting the product" });
  //   }
  // },

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
