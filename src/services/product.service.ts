import { Product } from "@/models";
import mongoose from "mongoose";

export const productService = {
  // Add or update product draft for a step
  addOrUpdateDraftProduct: async (stepData: any) => {
    try {
      let draftProduct: any = await Product.findOne({ status: "draft" });
      console.log("draftProduct : " , draftProduct)

      const validPlatforms = ["amazon", "ebay", "website"] as const;

      if (!draftProduct) {
        // Create a new draft product if none exists
        draftProduct = new Product({
          platformDetails: {
            amazon: {},
            ebay: {},
            website: {},
          },
          status: "draft",
          isBlocked: false,
        });
      }

      // Extract `productCategory` separately
      let commonCategoryValue: mongoose.Types.ObjectId | undefined;

      if (stepData.productCategory) {
        if (mongoose.isValidObjectId(stepData.productCategory)) {
          commonCategoryValue = new mongoose.Types.ObjectId(
            stepData.productCategory
          );
        } else {
          throw new Error("Invalid productCategory value.");
        }
      }

      // Iterate through stepData to populate platform-specific details
      Object.keys(stepData).forEach((key) => {
        const { value, isAmz, isEbay, isWeb } = stepData[key] || {};

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

      // Assign `productCategory` to all platform details
      if (commonCategoryValue) {
        validPlatforms.forEach((platform) => {
          draftProduct.platformDetails[platform].productCategory =
            commonCategoryValue;
        });
      }

      // Save the draft product
      await draftProduct.save();
      return draftProduct;
    } catch (error) {
      console.error("Error adding/updating draft product:", error);
      throw new Error("Failed to add or update draft product");
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
