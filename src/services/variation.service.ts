// /services/variation.service.ts
import { Product } from "@/models/product.model";

export const variationService = {
  getPartsByPlatform: async (platform: string) => {
    try {
      // Map platform to corresponding `prodTechInfo`
      let productKey = "";
      switch (platform.toLowerCase()) {
        case "amazon":
          productKey = "platformDetails.amazon.prodTechInfo";
          break;
        case "ebay":
          productKey = "platformDetails.ebay.prodTechInfo";
          break;
        case "website":
          productKey = "platformDetails.website.prodTechInfo";
          break;
        default:
          throw new Error("Invalid platform");
      }

      // Aggregate distinct parts
      const parts = await Product.aggregate([
        {
          $project: {
            cpu: `$${productKey}.processor`,
            ram: `$${productKey}.ramSize`,
            storage: `$${productKey}.storageType`,
            graphics: `$${productKey}.gpu`,
            height: `$${productKey}.height`,
            length: `$${productKey}.length`,
            width: `$${productKey}.width`,
          },
        },
        {
          $group: {
            _id: null,
            cpu: { $addToSet: "$cpu" },
            ram: { $addToSet: "$ram" },
            storage: { $addToSet: "$storage" },
            graphics: { $addToSet: "$graphics" },
            height: { $addToSet: "$height" },
            length: { $addToSet: "$length" },
            width: { $addToSet: "$width" },
          },
        },
        {
          $project: {
            _id: 0,
            cpu: 1,
            ram: 1,
            storage: 1,
            graphics: 1,
            height: 1,
            length: 1,
            width: 1,
          },
        },
      ]);

      return parts[0] || {};
    } catch (error) {
      console.error("Error fetching parts by platform:", error);
      throw new Error("Unable to fetch parts.");
    }
  },
};
