import { Variation } from "@/models";
import mongoose from "mongoose";
import { transformVariationData } from "@/utils/transformVariationData.util";
export const variationService = {
  // Create a new draft variation
  createDraftVariation: async (stepData: any) => {
    try {
      const variationCategory =
        stepData.variationCategory &&
        mongoose.isValidObjectId(stepData.variationCategory)
          ? new mongoose.Types.ObjectId(stepData.variationCategory)
          : null;

      if (!variationCategory) {
        throw new Error("Invalid or missing 'variationCategory'");
      }

      console.log("stepData in service for draft create : ", stepData);

      const draftVariation: any = new Variation({
        platformDetails: {
          amazon: {},
          ebay: {},
          website: {},
        },
        status: "draft",
        isBlocked: false,
      });
      console.log("draftVariation : ", draftVariation);

      Object.entries(stepData).forEach(([key, value]: [string, any]) => {
        const { value: fieldValue, isAmz, isEbay, isWeb } = value || {};
        if (isAmz)
          draftVariation.platformDetails.amazon.variationInfo[key] = fieldValue;
        if (isEbay)
          draftVariation.platformDetails.ebay.variationInfo[key] = fieldValue;
        if (isWeb)
          draftVariation.platformDetails.website.variationInfo[key] =
            fieldValue;
      });

      ["amazon", "ebay", "website"].forEach((platform) => {
        draftVariation.platformDetails[
          platform
        ].variationInfo.variationCategory = variationCategory;
        draftVariation.kind = stepData.kind;
      });

      await draftVariation.save();
      return draftVariation;
    } catch (error) {
      console.error("Error creating draft variation:", error);
      throw new Error("Failed to create draft variation");
    }
  },

  // Update an existing draft variation when user move to next stepper
  updateDraftVariation: async (variationId: string, stepData: any) => {
    try {
      // Fetch the existing draft variation
      const draftVariation: any = await Variation.findById(variationId);
      if (!draftVariation) {
        throw new Error("Draft variation not found");
      }
      console.log("stepDataaa in updateDraftVariation service : ", stepData);

      // this code will run only on final call (final stepper)
      if (stepData.status) {
        // console.log("asdadadads");
        console.log("draftVariation ka status: ", draftVariation.status);
        console.log("draftVariation ka templare: ", draftVariation.isTemplate);
        draftVariation.status = stepData.status; // Corrected to assignment
        draftVariation.isTemplate = stepData.isTemplate;
        await draftVariation.save(); // Assuming save is an async function
        return draftVariation;
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

          if (
            entry &&
            typeof entry === "object" &&
            !Array.isArray(entry) &&
            entry.value === undefined
          ) {
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

            if (
              fieldRoot === "packageWeight" ||
              fieldRoot === "packageDimensions"
            ) {
              // Handle nested objects like packageWeight
              const subField = fieldSegments.slice(1).join("."); // e.g., "weightKg" or "dimensionLength"
              if (isAmz)
                platformDetails.amazon.prodDelivery[fieldRoot] =
                  platformDetails.amazon.prodDelivery[fieldRoot] || {};
              if (isEbay)
                platformDetails.ebay.prodDelivery[fieldRoot] =
                  platformDetails.ebay.prodDelivery[fieldRoot] || {};
              if (isWeb)
                platformDetails.website.prodDelivery[fieldRoot] =
                  platformDetails.website.prodDelivery[fieldRoot] || {};
              if (isAmz && subField)
                platformDetails.amazon.prodDelivery[fieldRoot][subField] =
                  value;
              if (isEbay && subField)
                platformDetails.ebay.prodDelivery[fieldRoot][subField] = value;
              if (isWeb && subField)
                platformDetails.website.prodDelivery[fieldRoot][subField] =
                  value;
            } else {
              const step = stepData.step;
              console.log("step :", step);
              if (step === "prodTechInfo") {
                if (isAmz)
                  platformDetails.amazon.prodTechInfo[currentKey] = value;
                if (isEbay)
                  platformDetails.ebay.prodTechInfo[currentKey] = value;
                if (isWeb)
                  platformDetails.website.prodTechInfo[currentKey] = value;
              } else if (step === "variationInfo") {
                if (isAmz)
                  platformDetails.amazon.variationInfo[currentKey] = value;
                if (isEbay)
                  platformDetails.ebay.variationInfo[currentKey] = value;
                if (isWeb)
                  platformDetails.website.variationInfo[currentKey] = value;
              } else if (step === "prodPricing") {
                if (isAmz)
                  platformDetails.amazon.prodPricing[currentKey] = value;
                if (isEbay)
                  platformDetails.ebay.prodPricing[currentKey] = value;
                if (isWeb)
                  platformDetails.website.prodPricing[currentKey] = value;
              } else if (step === "prodDelivery") {
                if (isAmz)
                  platformDetails.amazon.prodDelivery[currentKey] = value;
                if (isEbay)
                  platformDetails.ebay.prodDelivery[currentKey] = value;
                if (isWeb)
                  platformDetails.website.prodDelivery[currentKey] = value;
              } else {
                if (isAmz) platformDetails.amazon.prodSeo[currentKey] = value;
                if (isEbay) platformDetails.ebay.prodSeo[currentKey] = value;
                if (isWeb) platformDetails.website.prodSeo[currentKey] = value;
              }
            }
          }
        });
        console.log("After processing platformDetails:", platformDetails);
      };

      // // Process technical details based on the discriminator (Laptops or others)
      // if (stepData.kind) {
      //   // Process technical details for Laptops
      //   processStepData(stepData, draftVariation.platformDetails);
      // } else {
      processStepData(stepData, draftVariation.platformDetails);
      // }

      // Save the updated draft variation
      await draftVariation.save();
      // console.log("Draft variation saved:", draftVariation);
      return draftVariation;
    } catch (error) {
      console.error("Error updating draft variation:", error);
      throw new Error("Failed to update draft variation");
    }
  },

  /**
   * Fetches the variation by ID and populates all nested fields.
   * @param id - Variation ID to fetch
   * @returns Populated variation document
   */
  getFullVariationById: async (id: string) => {
    try {
      const variation = await Variation.findById(id)
        .populate("platformDetails.amazon.variationInfo.variationCategory")
        .populate("platformDetails.ebay.variationInfo.variationCategory")
        .populate("platformDetails.website.variationInfo.variationCategory")
        .lean();

      if (!variation) throw new Error("Variation not found");
      return variation;
    } catch (error) {
      console.error(`Error fetching full variation by ID: ${id}`, error);
      throw new Error("Failed to fetch full variation");
    }
  },
  /**
   * Transforms and returns the variation data.
   * @param id - Variation ID
   * @returns Transformed variation data
   */
  transformAndSendVariation: async (id: string) => {
    try {
      if (!id || !mongoose.isValidObjectId(id)) {
        throw new Error("Invalid variation ID");
      }

      // Fetch the variation from the database
      const variation = await variationService.getFullVariationById(id);

      if (!variation) {
        throw new Error("Variation not found");
      }

      // Transform the fetched variation data
      const transformedVariation = transformVariationData(variation);
      return transformedVariation;
    } catch (error: any) {
      console.error("Error transforming variation:", error);
      throw new Error(error.message || "Error transforming variation");
    }
  },
  getAllVariations: async () => {
    try {
      return await Variation.find()
        .populate("platformDetails.website.variationInfo.variationCategory")
        .populate("platformDetails.amazon.variationInfo.variationCategory")
        .populate("platformDetails.ebay.variationInfo.variationCategory")
        .populate("platformDetails.website.prodPricing.paymentPolicy")
        .populate("platformDetails.amazon.prodPricing.paymentPolicy")
        .populate("platformDetails.ebay.prodPricing.paymentPolicy");
    } catch (error) {
      console.error("Error fetching all variations:", error);
      throw new Error("Failed to fetch variations");
    }
  },
  //getting all template variations name and their id

  getVariationsByCondition: async (condition: Record<string, any>) => {
    try {
      // Find variations matching the condition
      return await Variation.find(condition)
        .populate("platformDetails.website.variationInfo.variationCategory")
        .populate("platformDetails.amazon.variationInfo.variationCategory")
        .populate("platformDetails.ebay.variationInfo.variationCategory")
        .select(
          "_id platformDetails website.variationInfo variationCategory brand model srno kind"
        );
    } catch (error) {
      console.error("Error fetching variations by condition:", error);
      throw new Error("Failed to fetch variations by condition");
    }
  },
  getVariationById: async (id: string) => {
    try {
      const variation = await Variation.findById(id)
        .populate("platformDetails.website.variationInfo.variationCategory")
        .populate("platformDetails.amazon.variationInfo.variationCategory")
        .populate("platformDetails.ebay.variationInfo.variationCategory")
        .populate("platformDetails.website.prodPricing.paymentPolicy")
        .populate("platformDetails.amazon.prodPricing.paymentPolicy")
        .populate("platformDetails.ebay.prodPricing.paymentPolicy");
      if (!variation) throw new Error("Variation not foundf");
      // if (variation.platformDetails[platform]) {
      //   return variation.platformDetails[platform];
      // }
      // throw new Error(`No details found for platform: ${platform}`);
      return variation;
    } catch (error) {
      // console.error(`Error fetching variation by ID for platform ${platform}:`, error);
      console.error(`Error fetching variation`, error);
      throw new Error("Failed to fetch variation");
    }
  },

  updateVariation: async (
    id: string,
    platform: "amazon" | "ebay" | "website",
    data: any
  ) => {
    try {
      const updateQuery = { [`platformDetails.${platform}`]: data };
      const updatedVariation = await Variation.findByIdAndUpdate(
        id,
        updateQuery,
        {
          new: true,
        }
      );
      if (!updatedVariation) throw new Error("Variation not found");
      return updatedVariation.platformDetails[platform];
    } catch (error) {
      console.error(
        `Error updating variation for platform ${platform}:`,
        error
      );
      throw new Error("Failed to update variation");
    }
  },

  deleteVariation: (id: string) => {
    const variation = Variation.findByIdAndDelete(id);
    if (!variation) {
      throw new Error("Category not found");
    }
    return variation;
  },

  toggleBlock: async (id: string, isBlocked: boolean) => {
    try {
      const updatedVariation = await Variation.findByIdAndUpdate(
        id,
        { isBlocked },
        { new: true }
      );
      if (!updatedVariation) throw new Error("Variation not found");
      return updatedVariation;
    } catch (error) {
      console.error("Error toggling block status:", error);
      throw new Error("Failed to toggle block status");
    }
  },
};
