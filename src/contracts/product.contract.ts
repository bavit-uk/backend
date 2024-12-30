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
  // modelNumber?: string; // Specific to eBay and Website
}

// Pricing details shared between platforms
interface IPricing {
  pricePerUnit: number;
  discountPrice?: number;
  purchasePrice?: number;
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
  category: Types.ObjectId;
  productCondition: string;
  screenSize: string;
  nonNewConditionDetails: string;
  images: string[]; 
  
  // quantity: number; // Specific to Amazon
  // pricing: Omit<IPricing, "buyItNowPrice" | "auctionStartingPrice">;
  variation: string;
  condition: string;
  conditionDescription: string;
  productDescription: string;
  pricingFormat: string;
  vat: string;
  paymentPolicy: string;
  buy2andSave: string;
  buy3andSave: string;
  buy4andSave: string;
  
  // condition: ICondition;
  shipping: IShipping;
  description: string;
  keywords: IKeywords;
  fulfillmentMethod: "FBA" | "FBM";
  identifier: string; // UPC, EAN, ISBN, etc.
  vatPercentage: number,
  salesTaxPercentage: number,
  applyTaxAtCheckout: boolean,
  taxConfirmation: boolean,
}

// Platform-specific product details for eBay
interface IEbayPlatformDetails {
  title: string;
  brand: string;
  category: Types.ObjectId;
  productCondition: string;
  screenSize: string;
  nonNewConditionDetails: string;
  images: string[]; 

  // quantity: number;
  // pricing: IPricing;
  variation: string;
  condition: string;
  conditionDescription: string;
  productDescription: string;
  pricingFormat: string;
  vat: string;
  paymentPolicy: string;
  buy2andSave: string;
  buy3andSave: string;
  buy4andSave: string;

  // condition: ICondition;
  shipping: IShipping;
  description: string;
  keywords: IKeywords;
  fulfillmentMethod: "eBay Fulfillment" | "Self-Fulfilled";
  identifier: string; // UPC, EAN, ISBN, etc.
  vatPercentage: number,
  salesTaxPercentage: number,
  applyTaxAtCheckout: boolean,
  taxConfirmation: boolean,
}

// Platform-specific product details for Website
interface IWebsitePlatformDetails {
  title: string;
  brand: string;
  category: Types.ObjectId;
  productCondition: string;
  screenSize: string;
  nonNewConditionDetails: string;
  images: string[]; 

  // quantity: number;
  // pricing: Omit<IPricing, "buyItNowPrice" | "auctionStartingPrice">;
  
  variation: string;
  condition: string;
  conditionDescription: string;
  productDescription: string;
  pricingFormat: string;
  vat: string;
  paymentPolicy: string;
  buy2andSave: string;
  buy3andSave: string;
  buy4andSave: string;
  
  // condition: ICondition;
  shipping: IShipping;
  description: string;
  keywords: IKeywords;
  fulfillmentMethod: "Dropshipping" | "In-House Fulfillment";
  identifier: string; // UPC, EAN, ISBN, etc.
  vatPercentage: number,
  salesTaxPercentage: number,
  applyTaxAtCheckout: boolean,
  taxConfirmation: boolean,
}


// vatPercentage: { type: Number, required: true, default: 0 }, // VAT Percentage
//     salesTaxPercentage: { type: Number, required: true, default: 0 }, // Sales Tax Percentage
//     applyTaxAtCheckout: { type: Boolean, default: false }, // Apply Tax at checkout flag
//     taxConfirmation: { type: Boolean, default: false } // Tax confirmation flag

// Full Product Interface
interface IProduct {
  isBlocked: boolean; // Common details for all platforms
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
  ITechnicalSpecifications,
  IPricing,
  ICondition,
  IShipping,
  IKeywords,
  IAmazonPlatformDetails,
  IEbayPlatformDetails,
  IWebsitePlatformDetails,
};
