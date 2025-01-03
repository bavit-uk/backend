import { Product } from "@/models";
import mongoose from "mongoose";

export const productService = {
  // Create a new draft product
  createDraftProduct: async (stepData: any) => {
    try {
      const productCategory =
        stepData.productCategory && mongoose.isValidObjectId(stepData.productCategory)
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
        draftProduct.platformDetails[platform].productCategory = productCategory;
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
      console.log("stepDataaa : ", stepData);

     
        if (stepData.status) {
          console.log("asdadadads");
          console.log("draftProduct ka status: ", draftProduct.status);
          console.log("draftProduct ka templare: ", draftProduct.isTemplate);
          draftProduct.status = stepData.status; // Corrected to assignment
          draftProduct.isTemplate = stepData.isTemplate;
          await draftProduct.save(); // Assuming save is an async function
          return draftProduct;
        }
      
      

      // Helper function to process step data recursively
      const processStepData = (
        data: any,
        platformDetails: any,
        keyPrefix: string = "",
        inheritedFlags: { isAmz?: boolean; isEbay?: boolean; isWeb?: boolean } = {}
      ) => {
        Object.keys(data).forEach((key) => {
          const currentKey = keyPrefix ? `${keyPrefix}.${key}` : key; // Maintain context for nested keys
          const entry = data[key];

          // Inherit platform flags if not explicitly defined
          const {
            isAmz = inheritedFlags.isAmz,
            isEbay = inheritedFlags.isEbay,
            isWeb = inheritedFlags.isWeb,
          } = entry || {};

          if (entry && typeof entry === "object" && !Array.isArray(entry) && entry.value === undefined) {
            // Recurse for nested objects, passing inherited flags
            processStepData(entry, platformDetails, currentKey, { isAmz, isEbay, isWeb });
          } else {
            const { value } = entry || {};
            console.log("current key : ", currentKey);
            console.log("value : ", value);
            console.log("platforms : ", isEbay, isAmz, isWeb);
            console.log("  ");

            // Handle nested fields explicitly
            const fieldSegments = currentKey.split(".");
            const fieldRoot = fieldSegments[0]; // e.g., "packageWeight"

            if (fieldRoot === "packageWeight" || fieldRoot === "packageDimensions") {
              // Handle nested objects like packageWeight
              const subField = fieldSegments.slice(1).join("."); // e.g., "weightKg" or "dimensionLength"
              if (isAmz) platformDetails.amazon[fieldRoot] = platformDetails.amazon[fieldRoot] || {};
              if (isEbay) platformDetails.ebay[fieldRoot] = platformDetails.ebay[fieldRoot] || {};
              if (isWeb) platformDetails.website[fieldRoot] = platformDetails.website[fieldRoot] || {};

              if (isAmz && subField) platformDetails.amazon[fieldRoot][subField] = value;
              if (isEbay && subField) platformDetails.ebay[fieldRoot][subField] = value;
              if (isWeb && subField) platformDetails.website[fieldRoot][subField] = value;
            } else {
              // Handle flat fields
              if (isAmz) platformDetails.amazon[currentKey] = value;
              if (isEbay) platformDetails.ebay[currentKey] = value;
              if (isWeb) platformDetails.website[currentKey] = value;
            }
          }
        });
      };

      // Process step data
      processStepData(stepData, draftProduct.platformDetails);

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
      return await Product.find().populate("platformDetails.website.productCategory").populate("platformDetails.amazon.productCategory").populate("platformDetails.ebay.productCategory");
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw new Error("Failed to fetch products");
    }
  },

  getProductById: async (id: string, platform: "amazon" | "ebay" | "website") => {
    try {
      const product = await Product.findById(id);
      if (!product) throw new Error("Product not found");
      if (product.platformDetails[platform]) {
        return product.platformDetails[platform];
      }
      throw new Error(`No details found for platform: ${platform}`);
    } catch (error) {
      console.error(`Error fetching product by ID for platform ${platform}:`, error);
      throw new Error("Failed to fetch product");
    }
  },

  updateProduct: async (id: string, platform: "amazon" | "ebay" | "website", data: any) => {
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

  deleteProduct: (id: string) => {
    const product = Product.findByIdAndDelete(id);
    if (!product) {
      throw new Error("Category not found");
    }
    return product;
  },

  toggleBlock: async (id: string, isBlocked: boolean) => {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(id, { isBlocked }, { new: true });
      if (!updatedProduct) throw new Error("Product not found");
      return updatedProduct;
    } catch (error) {
      console.error("Error toggling block status:", error);
      throw new Error("Failed to toggle block status");
    }
  },
};
