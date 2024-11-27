import { Schema, model , Types} from "mongoose";
import { IAmazonPlatformDetails, ICommonProductDetails, IEbayPlatformDetails, IProduct, IWebsitePlatformDetails } from "@/contracts/product.contract"; // Adjust the path if necessary

// Common product details shared across platforms
const commonDetailsSchema = new Schema<ICommonProductDetails>({
  images: [{ type: String, required: true }], // Image URLs
});

// Amazon-specific fields
const amazonSchema = new Schema<IAmazonPlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  technicalSpecifications: {
    processorType: { type: String },
    ramSize: { type: String },
    storageDetails: { type: String },
    operatingSystem: { type: String },
    additionalSpecifications: { type: String },
  },
  quantity: { type: Number, required: true },
  pricing: {
    pricePerUnit: { type: Number, required: true },
    discountPrice: { type: Number },
  },
  condition: {
    status: { type: String, required: true },
    details: { type: String },
  },
  shipping: {
    weight: { type: String, required: true },
    options: [{ type: String }],
    estimatedDeliveryTime: { type: String, required: true },
  },
  description: { type: String, required: true },
  keywords: {
    relevantKeywords: [{ type: String }],
    suggestedKeywords: [{ type: String }],
  },
  fulfillmentMethod: { type: String, enum: ["FBA", "FBM"], required: true },
  identifier: { type: String, required: true }, // UPC, EAN, ISBN
});

// eBay-specific fields
const ebaySchema = new Schema<IEbayPlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  technicalSpecifications: {
    modelNumber: { type: String },
    ramSize: { type: String },
    storageDetails: { type: String },
    operatingSystem: { type: String },
    additionalSpecifications: { type: String },
  },
  quantity: { type: Number, required: true },
  pricing: {
    pricePerUnit: { type: Number, required: true },
    discountPrice: { type: Number },
    buyItNowPrice: { type: Number },
    auctionStartingPrice: { type: Number },
  },
  condition: {
    status: { type: String, required: true },
    details: { type: String },
  },
  shipping: {
    weight: { type: String, required: true },
    options: [{ type: String }],
    estimatedDeliveryTime: { type: String, required: true },
    handlingTime: { type: String },
  },
  description: { type: String, required: true },
  keywords: {
    relevantKeywords: [{ type: String }],
    suggestedKeywords: [{ type: String }],
  },
  fulfillmentMethod: { type: String, enum: ["eBay Fulfillment", "Self-Fulfilled"], required: true },
  identifier: { type: String, required: true }, // UPC, EAN, ISBN
});

// Website-specific fields
const websiteSchema = new Schema<IWebsitePlatformDetails>({
  title: { type: String, required: true },
  brand: { type: Schema.Types.ObjectId, ref: "ProductBrand", required: true }, // Reference to ProductCategory model
  category: { type: Schema.Types.ObjectId, ref: "ProductCategory", required: true }, // Reference to ProductCategory model
  technicalSpecifications: {
    modelNumber: { type: String },
    ramSize: { type: String },
    storageDetails: { type: String },
    operatingSystem: { type: String },
    additionalSpecifications: { type: String },
  },
  quantity: { type: Number, required: true },
  pricing: {
    pricePerUnit: { type: Number, required: true },
    discountPrice: { type: Number },
  },
  condition: {
    status: { type: String, required: true },
    details: { type: String },
  },
  shipping: {
    weight: { type: String, required: true },
    options: [{ type: String }],
    estimatedDeliveryTime: { type: String, required: true },
  },
  description: { type: String, required: true },
  keywords: {
    relevantKeywords: [{ type: String }],
    suggestedKeywords: [{ type: String }],
  },
  fulfillmentMethod: { type: String, enum: ["Dropshipping", "In-House Fulfillment"], required: true },
  identifier: { type: String, required: true }, // UPC, EAN, ISBN
});

// Main Product Schema
const productSchema = new Schema<IProduct>(
  {
    common: commonDetailsSchema, // Common details for all platforms
    platformDetails: {
      amazon: amazonSchema, // Amazon-specific details
      ebay: ebaySchema, // eBay-specific details
      website: websiteSchema, // Website-specific details
    },
    status: { type: String, enum: ["draft", "published"], default: "draft" }, // Product status
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

// Product Model
export const Product = model<IProduct>("Product", productSchema);
