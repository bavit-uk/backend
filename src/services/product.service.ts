import { Product } from "@/models";
import mongoose from "mongoose";

export const productService = {
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

      // Initialize a new product draft
      const draftProduct: any = new Product({
        platformDetails: {
          amazon: {},
          ebay: {},
          website: {},
        },
        status: "draft",
        isBlocked: false,
      });

      // Populate the platform details for the first step
      Object.keys(stepData).forEach((key) => {
        const { value, isAmz, isEbay, isWeb } = stepData[key] || {};

        if (isAmz) draftProduct.platformDetails.amazon[key] = value;
        if (isEbay) draftProduct.platformDetails.ebay[key] = value;
        if (isWeb) draftProduct.platformDetails.website[key] = value;
      });

      draftProduct.platformDetails.amazon.productCategory = productCategory;
      draftProduct.platformDetails.ebay.productCategory = productCategory;
      draftProduct.platformDetails.website.productCategory = productCategory;

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
      // Find the draft product by ID
      const draftProduct: any = await Product.findById(productId);

      if (!draftProduct) {
        throw new Error("Draft product not found");
      }

      // Merge the new step data into the existing platformDetails
      Object.keys(stepData).forEach((key) => {
        const { value, isAmz, isEbay, isWeb } = stepData[key] || {};

        // Convert `productCategory` to ObjectId if applicable
        const processedValue =
          key === "productCategory" && mongoose.isValidObjectId(value)
            ? new mongoose.Types.ObjectId(value)
            : value;

        if (isAmz) {
          draftProduct.platformDetails.amazon[key] = processedValue;
        }
        if (isEbay) {
          draftProduct.platformDetails.ebay[key] = processedValue;
        }
        if (isWeb) {
          draftProduct.platformDetails.website[key] = processedValue;
        }
      });

      // Save the updated draft product
      await draftProduct.save();
      return draftProduct;
    } catch (error) {
      console.error("Error updating draft product:", error);
      throw new Error("Failed to update draft product");
    }
  },

  // Get all products
  getAllProducts: async () => {
    try {
      return await Product.find();
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw new Error("Failed to fetch products");
    }
  },

  // Get a product by ID for a specific platform
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

  // Update product details for a specific platform
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

  // Toggle block status for a product
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
