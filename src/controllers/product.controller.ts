import { productService } from "@/services";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const productController = {
  // Add a new product
  addProduct: async (req: Request, res: Response) => {
    try {
      const { fields } = req.body;

      // Parse and structure platform-specific data
      const platformDetails: any = {
        amazon: {},
        ebay: {},
        website: {},
      };

      fields.forEach(({ name, value, isAmz, isEbay, isWebsite }: any) => {
        if (isAmz) platformDetails.amazon[name] = value;
        if (isEbay) platformDetails.ebay[name] = value;
        if (isWebsite) platformDetails.website[name] = value;
      });

      // Create a new product with platform-specific details
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
