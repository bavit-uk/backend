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

      console.log("stepData in service for draft create : ", stepData);

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
        draftProduct.kind = stepData.kind;
      });

      await draftProduct.save();
      return draftProduct;
    } catch (error) {
      console.error("Error creating draft product:", error);
      throw new Error("Failed to create draft product");
    }
  },

  // Update an existing draft product when user move to next stepper
  updateDraftProduct: async (productId: string, stepData: any) => {
    try {
      // Fetch the existing draft product
      const draftProduct: any = await Product.findById(productId);
      if (!draftProduct) {
        throw new Error("Draft product not found");
      }
      console.log("stepDataaa in updateDraftProduct service : ", stepData);

      // this code will run only on final call (final stepper)
      if (stepData.status) {
        // console.log("asdadadads");
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
        console.log("Before processing platformDetails:", platformDetails);

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
              console.log("asdasdasdasdasdasd")
              // console.log(platformDetails.amazon[currentKey] = value)
              console.log("is amz , is ebay , ie web : " , isAmz , isEbay , isWeb)
              if (isAmz) platformDetails.amazon[currentKey] = value;
              if (isEbay) platformDetails.ebay[currentKey] = value;
              if (isWeb) platformDetails.website[currentKey] = value;
            }
          }
        });
        console.log("After processing platformDetails:", platformDetails);
      };

      // Process technical details based on the discriminator (Laptops or others)
      if (draftProduct.kind === "Laptops" && stepData.kind) {
        // const { technicalInfo } = stepData;
        if (stepData.kind) {
          // Process technical details for Laptops
          processStepData(stepData, draftProduct.platformDetails);
        }
      } else if (draftProduct.kind === "All In One PC" && stepData.kind) {
        // const { technicalInfo } = stepData;
        if (stepData.kind) {
          // Process technical details for All In One PC
          processStepData(stepData, draftProduct.platformDetails);
        }
      } else if (draftProduct.kind === "Projectors" && stepData.kind) {
        // const { technicalInfo } = stepData;
        if (stepData.kind) {
          // Process technical details for Projectors
          processStepData(stepData, draftProduct.platformDetails);
        }
      } else if (draftProduct.kind === "Monitors" && stepData.kind) {
        // const { technicalInfo } = stepData;
        if (stepData.kind) {
          // Process technical details for Monitors
          processStepData(stepData, draftProduct.platformDetails);
        }
      } else if (draftProduct.kind === "Gaming PC" && stepData.kind) {
        // const { technicalInfo } = stepData;
        if (stepData.kind) {
          // Process technical details for Gaming PC
          processStepData(stepData, draftProduct.platformDetails);
        }
      } else if (draftProduct.kind === "Network Equipments" && stepData.kind) {
        // const { technicalInfo } = stepData;
        if (stepData.kind) {
          // Process technical details for Network Equipments
          processStepData(stepData, draftProduct.platformDetails);
        }
      } else {
        // Ensure platformDetails is initialized for all platforms
        draftProduct.platformDetails = draftProduct.platformDetails || { amazon: {}, ebay: {}, website: {} };

        // For all other product kinds, process the data normally
        console.log("else workingggg .....");
        processStepData(stepData, draftProduct.platformDetails);
        console.log("draftProduct.platformDetails : " , draftProduct.platformDetails)
      }

      // Save the updated draft product
      await draftProduct.save();
      console.log("Draft product saved:", draftProduct);
      return draftProduct;
    } catch (error) {
      console.error("Error updating draft product:", error);
      throw new Error("Failed to update draft product");
    }
  },

  getFullProductById: async (id: string) => {
    try {
      const product = await Product.findById(id)
        .populate("platformDetails.amazon.productCategory")
        .populate("platformDetails.ebay.productCategory")
        .populate("platformDetails.website.productCategory")
        .lean();
      if (!product) throw new Error("Product not found");
      return product;
    } catch (error) {
      console.error(`Error fetching full product by ID: ${id}`, error);
      throw new Error("Failed to fetch full product");
    }
  },

  getAllProducts: async () => {
    try {
      return await Product.find()
        .populate("platformDetails.website.productCategory")
        .populate("platformDetails.amazon.productCategory")
        .populate("platformDetails.ebay.productCategory")
        .populate("platformDetails.website.paymentPolicy")
        .populate("platformDetails.amazon.paymentPolicy")
        .populate("platformDetails.ebay.paymentPolicy");
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw new Error("Failed to fetch products");
    }
  },

  getProductById: async (id: string) => {
    try {
      const product = await Product.findById(id)
        .populate("platformDetails.website.productCategory")
        .populate("platformDetails.amazon.productCategory")
        .populate("platformDetails.ebay.productCategory")
        .populate("platformDetails.website.paymentPolicy")
        .populate("platformDetails.amazon.paymentPolicy")
        .populate("platformDetails.ebay.paymentPolicy");
      if (!product) throw new Error("Product not foundf");
      // if (product.platformDetails[platform]) {
      //   return product.platformDetails[platform];
      // }
      // throw new Error(`No details found for platform: ${platform}`);
      return product;
    } catch (error) {
      // console.error(`Error fetching product by ID for platform ${platform}:`, error);
      console.error(`Error fetching product`, error);
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
