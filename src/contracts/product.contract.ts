import { Document, Types } from "mongoose";

// Technical specifications shared between platforms
interface ITechnicalSpecifications {
  processorType?: string;
  motherboard?: string;
  cpuFan?: string;
  case?: string;
  accessories?: string;
  expansionsNetworking?: string;
  ramSize?: string;
  storageDetails?: string;
  graphicsCard?: string;
  operatingSystem?: string;
  additionalSpecifications?: string;
}

// Pricing details shared between platforms
interface IPricing {
  pricePerUnit: number;
  discountPrice?: number;
  purchasePrice?: number;
  buyItNowPrice?: number; // Specific to eBay
  auctionStartingPrice?: number; // Specific to eBay
}

// Product condition details
interface ICondition {
  status: string; // e.g., "New", "Used"
  details?: string; // Additional details for non-new condition
}

// Shipping details shared between platforms
interface IShipping {
  weight: string;
  options: string[]; // Array of shipping options
  estimatedDeliveryTime: string;
  handlingTime?: string; // Specific to eBay
  weightUnit?: string; // Specific to Website
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
  productCategory: Types.ObjectId;
  images: string[];
  productDescription: string;

  quantity: string;
  price: string;
  condition: string;
  conditionDescription?: string;
  pricingFormat: string;
  vat: string;
  paymentPolicy: Types.ObjectId;

  postagePolicy: string;
  packageWeight: {
    weightKg: string;
    weightG: string;
  };
  packageDimensions: {
    dimensionLength: string;
    dimensionWidth: string;
    dimensionHeight: string;
  };
  irregularPackage: boolean;

  seoTags: string[];
  relevantTags: string[];
  suggestedTags: string[];
}

// Platform-specific product details for eBay
interface IEbayPlatformDetails {
  title: string;
  brand: string;
  productCategory: Types.ObjectId;
  images: string[];
  productDescription: string;

  quantity: string;
  price: string;
  condition: string;
  conditionDescription?: string;
  pricingFormat: string;
  vat: string;
  paymentPolicy: Types.ObjectId;

  postagePolicy: string;
  packageWeight: {
    weightKg: string;
    weightG: string;
  };
  packageDimensions: {
    dimensionLength: string;
    dimensionWidth: string;
    dimensionHeight: string;
  };
  irregularPackage: boolean;

  seoTags: string[];
  relevantTags: string[];
  suggestedTags: string[];
}

// Platform-specific product details for Website
interface IWebsitePlatformDetails {
  title: string;
  brand: string;
  productCategory: Types.ObjectId;
  images: string[];
  productDescription: string;

  quantity: string;
  price: string;
  condition: string;
  conditionDescription?: string;
  pricingFormat: string;
  vat: string;
  model?: string;

  paymentPolicy: Types.ObjectId;

  postagePolicy: string;
  packageWeight: {
    weightKg: string;
    weightG: string;
  };
  packageDimensions: {
    dimensionLength: string;
    dimensionWidth: string;
    dimensionHeight: string;
  };
  irregularPackage: boolean;

  seoTags: string[];
  relevantTags: string[];
  suggestedTags: string[];
  prodTechInfo?: {
    processor?: string;

    model?: string;

    ssdCapacity?: string;

    hardDriveCapacity?: string;

    manufacturerWarranty?: string;

    type?: string;

    memory?: string;

    screenSize?: string;

    maxResolution?: string;

    gpu?: string;

    networkType?: string;

    processorType?: string;
  };
}

interface IPlatformProductInfo {
  productCategory: Types.ObjectId; // Populated with category details
  title: string;
  brand: string;
  productDescription: string;
  images: string[];
  model?: string;
  srno?: string;
}

// Full Product Interface
interface IProduct {
  isBlocked: boolean; // Common details for all platforms
  platformDetails: {
    amazon?: IAmazonPlatformDetails; // Amazon-specific details
    ebay?: IEbayPlatformDetails; // eBay-specific details
    website?: IWebsitePlatformDetails;
    // Website-specific details
  };
  status: "draft" | "published"; // Product status
  isTemplate: boolean;
  kind?: string;
}

// Update payload for product
export type IProductUpdatePayload = Partial<IProduct>;

// Exports
export {
  IProduct,
  ITechnicalSpecifications,
  IPricing,
  ICondition,
  IShipping,
  IKeywords,
  IAmazonPlatformDetails,
  IEbayPlatformDetails,
  IWebsitePlatformDetails,
  IPlatformProductInfo,
};
