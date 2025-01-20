import { Product } from "@/models";
import mongoose from "mongoose";
import { transformProductData } from "@/utils/transformProductData.util";
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
          amazon: {
            productInfo: {
              productCategory: null,
              title: "",
              productDescription: "",
              brand: "",
              images: [],
            },
          },
          ebay: {
            productInfo: {
              productCategory: null,
              title: "",
              productDescription: "",
              brand: "",
              images: [],
            },
          },
          website: {
            productInfo: {
              productCategory: null,
              title: "",
              productDescription: "",
              brand: "",
              images: [],
            },
          },
        },
        status: "draft",
        isBlocked: false,
      });
      console.log("draftProduct : ", draftProduct);

      Object.entries(stepData).forEach(([key, value]: [string, any]) => {
        const { value: fieldValue, isAmz, isEbay, isWeb } = value || {};
        if (isAmz) draftProduct.platformDetails.amazon.productInfo[key] = fieldValue;
        if (isEbay) draftProduct.platformDetails.ebay.productInfo[key] = fieldValue;
        if (isWeb) draftProduct.platformDetails.website.productInfo[key] = fieldValue;
      });

      ["amazon", "ebay", "website"].forEach((platform) => {
        draftProduct.platformDetails[platform].productInfo.productCategory = productCategory;
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
      // console.log("draftProduct in updateDraftProduct service : ", draftProduct);
      console.log("stepDataaa in updateDraftProduct service : ", stepData);

      // this code will run only on final call (final stepper)
      if (stepData.status) {
        // console.log("asdadadads");
        // console.log("draftProduct ka status: ", draftProduct.status);
        // console.log("draftProduct ka templare: ", draftProduct.isTemplate);
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
        inheritedFlags: {
          isAmz?: boolean;
          isEbay?: boolean;
          isWeb?: boolean;
        } = {}
      ) => {
        // console.log("Before processing platformDetails:", platformDetails);

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
            processStepData(entry, platformDetails, currentKey, {
              isAmz,
              isEbay,
              isWeb,
            });
          } else {
            const { value } = entry || {};
            console.log("current key : ", currentKey);
            console.log("value : ", value);
            console.log("platforms : ", isEbay, isAmz, isWeb);
            // console.log("  ");
            // Handle nested fields explicitly
            const fieldSegments = currentKey.split(".");
            const fieldRoot = fieldSegments[0]; // e.g., "packageWeight"

            if (fieldRoot === "packageWeight" || fieldRoot === "packageDimensions") {
              // Handle nested objects like packageWeight
              const subField = fieldSegments.slice(1).join("."); // e.g., "weightKg" or "dimensionLength"
              if (isAmz)
                platformDetails.amazon.prodDelivery[fieldRoot] = platformDetails.amazon.prodDelivery[fieldRoot] || {};
              if (isEbay)
                platformDetails.ebay.prodDelivery[fieldRoot] = platformDetails.ebay.prodDelivery[fieldRoot] || {};
              if (isWeb)
                platformDetails.website.prodDelivery[fieldRoot] = platformDetails.website.prodDelivery[fieldRoot] || {};

              if (isAmz && subField) platformDetails.amazon.prodDelivery[fieldRoot][subField] = value;
              if (isEbay && subField) platformDetails.ebay.prodDelivery[fieldRoot][subField] = value;
              if (isWeb && subField) platformDetails.website.prodDelivery[fieldRoot][subField] = value;
            } else {
              const step = stepData.step;
              console.log("step :", step);
              if (step === "prodTechInfo") {
                if (isAmz) platformDetails.amazon.prodTechInfo[currentKey] = value;
                if (isEbay) platformDetails.ebay.prodTechInfo[currentKey] = value;
                if (isWeb) platformDetails.website.prodTechInfo[currentKey] = value;
              } else if (step === "productInfo") {

                console.log("in productInfo if section ");
                console.log("platformDetails.amazon.productInfo before: ", platformDetails.amazon.productInfo);
                console.log("platformDetails.ebay.productInfo before: ", platformDetails.ebay.productInfo);
                console.log("platformDetails.website.productInfo before: ", platformDetails.website.productInfo);

                // Initialize productInfo for all platforms as needed
                if (isAmz && !platformDetails.amazon.productInfo) {
                  platformDetails.amazon.productInfo = {};
                }
                if (isEbay && !platformDetails.ebay.productInfo) {
                  platformDetails.ebay.productInfo = {};
                }
                if (isWeb && !platformDetails.website.productInfo) {
                  platformDetails.website.productInfo = {};
                }

                console.log("    ")

                // Assign values to the correct platform
                if (isAmz) platformDetails.amazon.productInfo[currentKey] = value;
                if (isEbay) platformDetails.ebay.productInfo[currentKey] = value;
                if (isWeb) platformDetails.website.productInfo[currentKey] = value;

                console.log("platformDetails.amazon.productInfo after: ", platformDetails.amazon.productInfo);
                console.log("platformDetails.ebay.productInfo after: ", platformDetails.ebay.productInfo);
                console.log("platformDetails.website.productInfo after: ", platformDetails.website.productInfo);

              } else if (step === "prodPricing") {
                if (isAmz) platformDetails.amazon.prodPricing[currentKey] = value;
                if (isEbay) platformDetails.ebay.prodPricing[currentKey] = value;
                if (isWeb) platformDetails.website.prodPricing[currentKey] = value;
              } else if (step === "prodDelivery") {
                if (isAmz) platformDetails.amazon.prodDelivery[currentKey] = value;
                if (isEbay) platformDetails.ebay.prodDelivery[currentKey] = value;
                if (isWeb) platformDetails.website.prodDelivery[currentKey] = value;
              } else {
                if (isAmz) platformDetails.amazon.prodSeo[currentKey] = value;
                if (isEbay) platformDetails.ebay.prodSeo[currentKey] = value;
                if (isWeb) platformDetails.website.prodSeo[currentKey] = value;
              }
            }
          }
        });
        // console.log("After processing platformDetails:", platformDetails);
      };

      // // Process technical details based on the discriminator (Laptops or others)
      // if (stepData.kind) {
      //   // Process technical details for Laptops
      //   processStepData(stepData, draftProduct.platformDetails);
      // } else {
      processStepData(stepData, draftProduct.platformDetails);
      // }

      // Save the updated draft product
      await draftProduct.save();
      // console.log("Draft product saved:", draftProduct);
      return draftProduct;
    } catch (error) {
      console.error("Error updating draft product:", error);
      throw new Error("Failed to update draft product");
    }
  },

  /**
   * Fetches the product by ID and populates all nested fields.
   * @param id - Product ID to fetch
   * @returns Populated product document
   */
  getFullProductById: async (id: string) => {
    try {
      const product = await Product.findById(id)
        .populate("platformDetails.amazon.productInfo.productCategory")
        .populate("platformDetails.ebay.productInfo.productCategory")
        .populate("platformDetails.website.productInfo.productCategory")
        // .lean();

      if (!product) throw new Error("Product not found");
      return product;
    } catch (error) {
      console.error(`Error fetching full product by ID: ${id}`, error);
      throw new Error("Failed to fetch full product");
    }
  },
  /**
   * Transforms and returns the product data.
   * @param id - Product ID
   * @returns Transformed product data
   */
  // transformAndSendProduct: async (id: string) => {
  //   try {
  //     if (!id || !mongoose.isValidObjectId(id)) {
  //       throw new Error("Invalid product ID");
  //     }

  //     // Fetch the product from the database
  //     const product = await productService.getFullProductById(id);

  //     if (!product) {
  //       throw new Error("Product not found");
  //     }

  //     // Transform the fetched product data
  //     const transformedProduct = transformProductData(product);
  //     return transformedProduct;
  //   } catch (error: any) {
  //     console.error("Error transforming product:", error);
  //     throw new Error(error.message || "Error transforming product");
  //   }
  // },
  getAllProducts: async () => {
    try {
      return await Product.find()
        .populate("platformDetails.website.productInfo.productCategory")
        .populate("platformDetails.amazon.productInfo.productCategory")
        .populate("platformDetails.ebay.productInfo.productCategory")
        .populate("platformDetails.website.prodPricing.paymentPolicy")
        .populate("platformDetails.amazon.prodPricing.paymentPolicy")
        .populate("platformDetails.ebay.prodPricing.paymentPolicy");
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw new Error("Failed to fetch products");
    }
  },
  //getting all template products name and their id

  getProductsByCondition: async (condition: Record<string, any>) => {
    try {
      // Find products matching the condition
      return await Product.find(condition)
        .populate("platformDetails.website.productInfo.productCategory")
        .populate("platformDetails.amazon.productInfo.productCategory")
        .populate("platformDetails.ebay.productInfo.productCategory")
        .select("_id platformDetails website.productInfo productCategory brand model srno kind");
    } catch (error) {
      console.error("Error fetching products by condition:", error);
      throw new Error("Failed to fetch products by condition");
    }
  },
  getProductById: async (id: string) => {
    try {
      const product = await Product.findById(id)
        .populate("platformDetails.website.productInfo.productCategory")
        .populate("platformDetails.amazon.productInfo.productCategory")
        .populate("platformDetails.ebay.productInfo.productCategory")
        .populate("platformDetails.website.prodPricing.paymentPolicy")
        .populate("platformDetails.amazon.prodPricing.paymentPolicy")
        .populate("platformDetails.ebay.prodPricing.paymentPolicy");
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
