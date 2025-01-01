import { Product } from "@/models";
import mongoose from "mongoose";

export const productService = {
  // Create a new draft product
  createDraftProduct: async (stepData: any) => {
    try {
      const productCategory =
        stepData.productCategory &&
        mongoose.isValidObjectId(stepData.productCategory)
          ? new mongoose.Types.ObjectId(stepData.productCategory)
          : null;

      if (!productCategory) {
        throw new Error("Invalid or missing 'productCategory'");
      }

      const draftProduct: any = new Product({
        platformDetails: {
          amazon: {},
          ebay: {},
          website: {},
        },
        status: "draft",
        isBlocked: false,
      });

      Object.entries(stepData).forEach(([key, value]: [string, any]) => {
        const { value: fieldValue, isAmz, isEbay, isWeb } = value || {};
        if (isAmz) draftProduct.platformDetails.amazon[key] = fieldValue;
        if (isEbay) draftProduct.platformDetails.ebay[key] = fieldValue;
        if (isWeb) draftProduct.platformDetails.website[key] = fieldValue;
      });

      ["amazon", "ebay", "website"].forEach((platform) => {
        draftProduct.platformDetails[platform].productCategory =
          productCategory;
      });

      await draftProduct.save();
      return draftProduct;
    } catch (error) {
      console.error("Error creating draft product:", error);
      throw new Error("Failed to create draft product");
    }
  },

  // Update an existing draft product
  updateDraftProduct: async (productId: string, stepData: any) => {
    try {
      // Fetch the existing draft product
      const draftProduct: any = await Product.findById(productId);

      if (!draftProduct) {
        throw new Error("Draft product not found");
      }

      // Merge current step data with existing draft data
      Object.keys(stepData).forEach((key) => {
        const { value, isAmz, isEbay, isWeb } = stepData[key] || {};

        if (isAmz) draftProduct.platformDetails.amazon[key] = value;
        if (isEbay) draftProduct.platformDetails.ebay[key] = value;
        if (isWeb) draftProduct.platformDetails.website[key] = value;
      });

      // Save the updated draft product
      await draftProduct.save();
      return draftProduct;
    } catch (error) {
      console.error("Error updating draft product:", error);
      throw new Error("Failed to update draft product");
    }
  },

  getAllProducts: async () => {
    try {
      return await Product.find();
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw new Error("Failed to fetch products");
    }
  },

  getProductById: async (
    id: string,
    platform: "amazon" | "ebay" | "website"
  ) => {
    try {
      const product = await Product.findById(id);
      if (!product) throw new Error("Product not found");
      if (product.platformDetails[platform]) {
        return product.platformDetails[platform];
      }
      throw new Error(`No details found for platform: ${platform}`);
    } catch (error) {
      console.error(
        `Error fetching product by ID for platform ${platform}:`,
        error
      );
      throw new Error("Failed to fetch product");
    }
  },

  updateProduct: async (
    id: string,
    platform: "amazon" | "ebay" | "website",
    data: any
  ) => {
    try {
      const updateQuery = { [`platformDetails.${platform}`]: data };
      const updatedProduct = await Product.findByIdAndUpdate(id, updateQuery, {
        new: true,
      });
      if (!updatedProduct) throw new Error("Product not found");
      return updatedProduct.platformDetails[platform];
    } catch (error) {
      console.error(`Error updating product for platform ${platform}:`, error);
      throw new Error("Failed to update product");
    }
  },

  toggleBlock: async (id: string, isBlocked: boolean) => {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { isBlocked },
        { new: true }
      );
      if (!updatedProduct) throw new Error("Product not found");
      return updatedProduct;
    } catch (error) {
      console.error("Error toggling block status:", error);
      throw new Error("Failed to toggle block status");
    }
  },
};
