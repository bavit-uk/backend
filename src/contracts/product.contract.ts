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
  category: Types.ObjectId;
  productCondition: string;
  screenSize: string;
  nonNewConditionDetails?: string;
  images: string[];
  variation: string;
  condition: string;
  conditionDescription?: string;
  productDescription: string;
  pricingFormat: string;
  vat: string;
  paymentPolicy: string;
  buy2andSave: string;
  buy3andSave: string;
  buy4andSave: string;
  shipping: IShipping;
  description: string;
  keywords: IKeywords;
  fulfillmentMethod: "FBA" | "FBM";
  identifier: string; // UPC, EAN, ISBN, etc.
  vatPercentage: number;
  salesTaxPercentage: number;
  applyTaxAtCheckout: boolean;
  taxConfirmation: boolean;
  processor: string;
  model: string;
  operatingSystem: String;
  storageType: String;
  features: String;
  ssdCapacity: String;
  gpu: String;
  type: String;
  releaseYear: String;
  hardDriveCapacity: String;
  color: String;
  maxResolution: String;
  mostSuitableFor: String;
  graphicsProcessingType: String;
  connectivity: String;
  manufacturerWarranty: String;
  regionOfManufacture: String;
  height: String;
  length: String;
  weight: String;
  width: String;
}

// Platform-specific product details for eBay
interface IEbayPlatformDetails {
  title: string;
  brand: string;
  category: Types.ObjectId;
  productCondition: string;
  screenSize: string;
  nonNewConditionDetails?: string;
  images: string[];
  variation: string;
  condition: string;
  conditionDescription?: string;
  productDescription: string;
  pricingFormat: string;
  vat: string;
  paymentPolicy: string;
  buy2andSave: string;
  buy3andSave: string;
  buy4andSave: string;
  shipping: IShipping;
  description: string;
  keywords: IKeywords;
  fulfillmentMethod: "eBay Fulfillment" | "Self-Fulfilled";
  identifier: string; // UPC, EAN, ISBN, etc.
  vatPercentage: number;
  salesTaxPercentage: number;
  applyTaxAtCheckout: boolean;
  taxConfirmation: boolean;
  processor: string;
  model: string;

  operatingSystem: String;
  storageType: String;
  features: String;
  ssdCapacity: String;
  gpu: String;
  type: String;
  releaseYear: String;
  hardDriveCapacity: String;
  color: String;
  maxResolution: String;
  mostSuitableFor: String;
  graphicsProcessingType: String;
  connectivity: String;
  manufacturerWarranty: String;
  regionOfManufacture: String;
  height: String;
  length: String;
  weight: String;
  width: String;
}

// Platform-specific product details for Website
interface IWebsitePlatformDetails {
  title: string;
  brand: string;
  category: Types.ObjectId;
  productCondition: string;
  screenSize: string;
  nonNewConditionDetails?: string;
  images: string[];
  processor: string;
  model: string;
  variation: string;
  condition: string;
  conditionDescription?: string;
  productDescription: string;
  pricingFormat: string;
  vat: string;
  paymentPolicy: string;
  buy2andSave: string;
  buy3andSave: string;
  buy4andSave: string;
  shipping: IShipping;
  description: string;
  keywords: IKeywords;
  fulfillmentMethod: "Dropshipping" | "In-House Fulfillment";
  identifier: string; // UPC, EAN, ISBN, etc.
  vatPercentage: number;
  salesTaxPercentage: number;
  applyTaxAtCheckout: boolean;
  taxConfirmation: boolean;
  operatingSystem: String;
  storageType: String;
  features: String;
  ssdCapacity: String;
  gpu: String;
  type: String;
  releaseYear: String;
  hardDriveCapacity: String;
  color: String;
  maxResolution: String;
  mostSuitableFor: String;
  graphicsProcessingType: String;
  connectivity: String;
  manufacturerWarranty: String;
  regionOfManufacture: String;
  height: String;
  length: String;
  weight: String;
  width: String;
}

// Full Product Interface
interface IProduct {
  isBlocked: boolean; // Common details for all platforms
  platformDetails: {
    amazon?: IAmazonPlatformDetails; // Amazon-specific details
    ebay?: IEbayPlatformDetails; // eBay-specific details
    website?: IWebsitePlatformDetails; // Website-specific details
  };
  status: "draft" | "published"; // Product status
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
};