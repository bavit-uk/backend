import { Schema, model, Types } from "mongoose";
import { IAmazonPlatformDetails, IEbayPlatformDetails, IProduct, IWebsitePlatformDetails } from "@/contracts/product.contract"; // Adjust the path if necessary


// Amazon-specific fields
const amazonSchema = new Schema<IAmazonPlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "productCategory", required: true },
  technicalSpecifications: {
    processorType: { type: String },
    motherboard: { type: String }, // Added motherboard
    cpuFan: { type: String }, // Added CPU fan
    case: { type: String }, // Added case
    accessoriesExpansionsNetworking: { type: String }, // Added Accessories/Expansions/Networking
    ramSize: { type: String },
    storageDetails: { type: String },
    graphicsCard: { type: String }, // Added Graphics Card
    operatingSystem: { type: String },
    additionalSpecifications: { type: String },
  },
  quantity: { type: Number, },
  pricing: {
    pricePerUnit: { type: Number, },
    discountPrice: { type: Number },
  },
  condition: {
    status: { type: String, enum: ["New", "Refurbished", "Used"] }, // Added enum for consistency
    details: { type: String },
  },
  shipping: {
    weight: { type: String, },
    options: [{ type: String }],
    estimatedDeliveryTime: { type: String, },
  },
  description: { type: String, },
  keywords: {
    relevantKeywords: [{ type: String }],
    suggestedKeywords: [{ type: String }],
  },
  fulfillmentMethod: { type: String, enum: ["FBA", "FBM"]},
  identifier: { type: String }, // UPC, EAN, ISBN
  vatPercentage: { type: Number, default: 0 }, // VAT Percentage
    salesTaxPercentage: { type: Number, default: 0 }, // Sales Tax Percentage
    applyTaxAtCheckout: { type: Boolean }, // Apply Tax at checkout flag
    taxConfirmation: { type: Boolean } // Tax confirmation flag
});

// eBay-specific fields
const ebaySchema = new Schema<IEbayPlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "ProductCategory", required: true },
  technicalSpecifications: {
    modelNumber: { type: String },
    motherboard: { type: String }, // Added motherboard
    cpuFan: { type: String }, // Added CPU fan
    case: { type: String }, // Added case
    accessoriesExpansionsNetworking: { type: String }, // Added Accessories/Expansions/Networking
    ramSize: { type: String },
    storageDetails: { type: String },
    graphicsCard: { type: String }, // Added Graphics Card
    operatingSystem: { type: String },
    additionalSpecifications: { type: String },
  },
  quantity: { type: Number },
  pricing: {
    pricePerUnit: { type: Number },
    discountPrice: { type: Number },
    buyItNowPrice: { type: Number }, // Already present
    auctionStartingPrice: { type: Number }, // Already present
  },
  condition: {
    status: { type: String,  enum: ["New", "Refurbished", "Used"] }, // Added enum
    details: { type: String },
  },
  shipping: {
    weight: { type: String, },
    options: [{ type: String }],
    estimatedDeliveryTime: { type: String,  },
    handlingTime: { type: String }, // Already present
  },
  description: { type: String, },
  keywords: {
    relevantKeywords: [{ type: String }],
    suggestedKeywords: [{ type: String }],
  },
  fulfillmentMethod: { type: String, enum: ["eBay Fulfillment", "Self-Fulfilled"],  },
  identifier: { type: String,}, // UPC, EAN, ISBN
  vatPercentage: { type: Number,  default: 0 }, // VAT Percentage
    salesTaxPercentage: { type: Number, default: 0 }, // Sales Tax Percentage
    applyTaxAtCheckout: { type: Boolean,  }, // Apply Tax at checkout flag
    taxConfirmation: { type: Boolean, } // Tax confirmation flag
});

// Website-specific fields
const websiteSchema = new Schema<IWebsitePlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "ProductCategory", required: true },
  technicalSpecifications: {
    modelNumber: { type: String },
    motherboard: { type: String }, // Added motherboard
    cpuFan: { type: String }, // Added CPU fan
    case: { type: String }, // Added case
    accessoriesExpansionsNetworking: { type: String }, // Added Accessories/Expansions/Networking
    ramSize: { type: String },
    storageDetails: { type: String },
    graphicsCard: { type: String }, // Added Graphics Card
    operatingSystem: { type: String },
    additionalSpecifications: { type: String },
  },
  quantity: { type: Number },
  pricing: {
    pricePerUnit: { type: Number},
    discountPrice: { type: Number },
  },
  condition: {
    status: { type: String,  enum: ["New", "Refurbished", "Used"] }, // Added enum
    details: { type: String },
  },
  shipping: {
    weight: { type: String, },
    options: [{ type: String }],
    estimatedDeliveryTime: { type: String,  },
  },
  description: { type: String, },
  keywords: {
    relevantKeywords: [{ type: String }],
    suggestedKeywords: [{ type: String }],
  },
  fulfillmentMethod: { type: String, enum: ["Dropshipping", "In-House Fulfillment"] },
  identifier: { type: String }, // UPC, EAN, ISBN
  vatPercentage: { type: Number,  default: 0 }, // VAT Percentage
    salesTaxPercentage: { type: Number,  default: 0 }, // Sales Tax Percentage
    applyTaxAtCheckout: { type: Boolean, default: false }, // Apply Tax at checkout flag
    taxConfirmation: { type: Boolean, default: false } // Tax confirmation flag
});

// Main Product Schema
const productSchema = new Schema<IProduct>(
  {
    images: [{ type: String, required: true }], // Image URLs
    platformDetails: {
      amazon: amazonSchema, // Amazon-specific details
      ebay: ebaySchema, // eBay-specific details
      website: websiteSchema, // Website-specific details
    },
    isBlocked: {type: Boolean , default: false},
    status: { type: String, enum: ["draft", "published"], default: "draft" }, // Product status
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

// Product Model
export const Product = model<IProduct>("Product", productSchema);
