import { Document, Types } from "mongoose";

// Common product details shared across platforms
interface ICommonProductDetails {
  images: string[]; // Array of image URLs
}

// Technical specifications shared between platforms
interface ITechnicalSpecifications {
  processorType?: string;
  ramSize?: string;
  storageDetails?: string;
  operatingSystem?: string;
  additionalSpecifications?: string;
  modelNumber?: string; // Specific to eBay and Website
}

// Pricing details shared between platforms
interface IPricing {
  pricePerUnit: number;
  discountPrice?: number;
  buyItNowPrice?: number; // Specific to eBay
  auctionStartingPrice?: number; // Specific to eBay
}

// Product condition
interface ICondition {
  status: string; // New, Used, etc.
  details?: string; // Details for non-new condition
}

// Shipping details shared between platforms
interface IShipping {
  weight: string;
  options: string[]; // Array of shipping options
  estimatedDeliveryTime: string;
  handlingTime?: string; // Specific to eBay
}

// Keywords for SEO or product metadata
interface IKeywords {
  relevantKeywords?: string[]; // Array of relevant keywords
  suggestedKeywords?: string[]; // Array of suggested keywords
}

// Platform-specific product details for Amazon
interface IAmazonPlatformDetails {
  title: string;
  brand: string;
  category: string;
  technicalSpecifications: ITechnicalSpecifications;
  quantity: number; // Specific to Amazon
  pricing: Omit<IPricing, "buyItNowPrice" | "auctionStartingPrice">;
  condition: ICondition;
  shipping: IShipping;
  description: string;
  keywords: IKeywords;
  fulfillmentMethod: "FBA" | "FBM";
  identifier: string; // UPC, EAN, ISBN, etc.
}

// Platform-specific product details for eBay
interface IEbayPlatformDetails {
  title: string;
  brand: string;
  category: string;
  technicalSpecifications: ITechnicalSpecifications;
  quantity: number;
  pricing: IPricing;
  condition: ICondition;
  shipping: IShipping;
  description: string;
  keywords: IKeywords;
  fulfillmentMethod: "eBay Fulfillment" | "Self-Fulfilled";
  identifier: string; // UPC, EAN, ISBN, etc.
}

// Platform-specific product details for Website
interface IWebsitePlatformDetails {
  title: string;
  brand: Types.ObjectId | string;
  category: Types.ObjectId | string;
  technicalSpecifications: ITechnicalSpecifications;
  quantity: number;
  pricing: Omit<IPricing, "buyItNowPrice" | "auctionStartingPrice">;
  condition: ICondition;
  shipping: IShipping;
  description: string;
  keywords: IKeywords;
  fulfillmentMethod: "Dropshipping" | "In-House Fulfillment";
  identifier: string; // UPC, EAN, ISBN, etc.
}

// Full Product Interface
interface IProduct {
  common: ICommonProductDetails; // Common details for all platforms
  platformDetails: {
    amazon: IAmazonPlatformDetails; // Amazon-specific details
    ebay: IEbayPlatformDetails; // eBay-specific details
    website: IWebsitePlatformDetails; // Website-specific details
  };
  status: "draft" | "published"; // Product status
}

export type IProductUpdatePayload = Partial<IProduct>

export {
  IProduct,
  ICommonProductDetails,
  ITechnicalSpecifications,
  IPricing,
  ICondition,
  IShipping,
  IKeywords,
  IAmazonPlatformDetails,
  IEbayPlatformDetails,
  IWebsitePlatformDetails,
};
