import mongoose, { Schema, model } from "mongoose";
import {
  IAmazonPlatformDetails,
  IEbayPlatformDetails,
  IWebsitePlatformDetails,
  IProduct,
} from "@/contracts/product.contract";

const options = { discriminatorKey: "kind" };

// Amazon-specific schema
const amazonSchema = new Schema<IAmazonPlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  productCategory: {
    type: Schema.Types.ObjectId,
    ref: "productCategory",
    required: true,
  },
  screenSize: { type: String, required: true },
  productCondition: { type: String, required: true },
  nonNewConditionDetails: { type: String },
  images: [{ type: String, required: true }],
  processor: { type: String },
  model: { type: String },
  operatingSystem: { type: String },
  storageType: { type: String },
  features: { type: String },
  ssdCapacity: { type: String },
  gpu: { type: String },
  type: { type: String },
  releaseYear: { type: String },
  hardDriveCapacity: { type: String },
  color: { type: String },
  maxResolution: { type: String },
  mostSuitableFor: { type: String },
  graphicsProcessingType: { type: String },
  connectivity: { type: String },
  manufacturerWarranty: { type: String },
  regionOfManufacture: { type: String },
  height: { type: String },
  length: { type: String },

  seoTags: {
    type: [String]
  },
  relevantTags: {
    type: [String]
  },
  suggestedTags: {
    type: [String]
  },
  postagePolicy: {
    type: String,
  },
  packageWeight: {
    weightKg: {
      type: String,
    },
    weightG: {
      type: String,
    },
  },
  packageDimensions: {
    dimensionLength: {
      type: String,
    },
    dimensionWidth: {
      type: String,
    },
    dimensionHeight: {
      type: String,
    },
  },
  irregularPackage: { type: Boolean },


  weight: { type: String },
  width: { type: String },
  condition: { type: String },
  conditionDescription: { type: String },
  productDescription: { type: String },
  pricingFormat: { type: String },
  vat: { type: String },
  paymentPolicy: { type: Schema.Types.ObjectId, ref: "paymentPolicy",},
  buy2andSave: { type: String },
  buy3andSave: { type: String },
  buy4andSave: { type: String },
  shipping: {
    weight: { type: String },
    options: [{ type: String }],
    estimatedDeliveryTime: { type: String },
  },
  description: { type: String },
  keywords: {
    relevantKeywords: [{ type: String }],
    suggestedKeywords: [{ type: String }],
  },
  fulfillmentMethod: { type: String, enum: ["FBA", "FBM"] },
  identifier: { type: String },
  vatPercentage: { type: Number, default: 0 },
  salesTaxPercentage: { type: Number, default: 0 },
  applyTaxAtCheckout: { type: Boolean },
  taxConfirmation: { type: Boolean },
});

// eBay-specific schema
const ebaySchema = new Schema<IEbayPlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  productCategory: {
    type: Schema.Types.ObjectId,
    ref: "productCategory",
    required: true,
  },
  screenSize: { type: String, required: true },
  productCondition: { type: String, required: true },
  nonNewConditionDetails: { type: String },
  images: [{ type: String, required: true }],
  processor: { type: String },
  model: { type: String },
  operatingSystem: { type: String },
  storageType: { type: String },
  features: { type: String },
  ssdCapacity: { type: String },
  gpu: { type: String },
  type: { type: String },
  releaseYear: { type: String },
  hardDriveCapacity: { type: String },

  seoTags: {
    type: [String]
  },
  relevantTags: {
    type: [String]
  },
  suggestedTags: {
    type: [String]
  },

  postagePolicy: {
    type: String,
  },
  packageWeight: {
    weightKg: {
      type: String,
    },
    weightG: {
      type: String,
    },
  },
  packageDimensions: {
    dimensionLength: {
      type: String,
    },
    dimensionWidth: {
      type: String,
    },
    dimensionHeight: {
      type: String,
    },
  },
  irregularPackage: { type: Boolean },
  color: { type: String },
  maxResolution: { type: String },
  mostSuitableFor: { type: String },
  graphicsProcessingType: { type: String },
  connectivity: { type: String },
  manufacturerWarranty: { type: String },
  regionOfManufacture: { type: String },
  height: { type: String },
  length: { type: String },
  weight: { type: String },
  width: { type: String },
  variation: { type: String },
  condition: { type: String },
  conditionDescription: { type: String },
  productDescription: { type: String },
  pricingFormat: { type: String },
  vat: { type: String },
  paymentPolicy: { type: Schema.Types.ObjectId, ref: "paymentPolicy",},
  buy2andSave: { type: String },
  buy3andSave: { type: String },
  buy4andSave: { type: String },
  shipping: {
    weight: { type: String },
    options: [{ type: String }],
    estimatedDeliveryTime: { type: String },
    handlingTime: { type: String },
  },
  description: { type: String },
  keywords: {
    relevantKeywords: [{ type: String }],
    suggestedKeywords: [{ type: String }],
  },
  fulfillmentMethod: {
    type: String,
    enum: ["eBay Fulfillment", "Self-Fulfilled"],
  },
  identifier: { type: String },
  vatPercentage: { type: Number, default: 0 },
  salesTaxPercentage: { type: Number, default: 0 },
  applyTaxAtCheckout: { type: Boolean },
  taxConfirmation: { type: Boolean },
});

// Website-specific schema
const websiteSchema = new Schema<IWebsitePlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  productCategory: {
    type: Schema.Types.ObjectId,
    ref: "productCategory",
    required: true,
  },
  screenSize: { type: String, required: true },
  productCondition: { type: String, required: true },
  nonNewConditionDetails: { type: String },
  images: [{ type: String, required: true }],
  processor: { type: String },
  model: { type: String },
  operatingSystem: { type: String },
  storageType: { type: String },
  features: { type: String },
  ssdCapacity: { type: String },
  gpu: { type: String },
  type: { type: String },




  postagePolicy: {
    type: String,
  },
  packageWeight: {
    weightKg: {
      type: String,
    },
    weightG: {
      type: String,
    },
  },
  packageDimensions: {
    dimensionLength: {
      type: String,
    },
    dimensionWidth: {
      type: String,
    },
    dimensionHeight: {
      type: String,
    },
  },
  seoTags: {
    type: [String]
  },
  relevantTags: {
    type: [String]
  },
  suggestedTags: {
    type: [String]
  },
  irregularPackage: { type: Boolean },
  releaseYear: { type: String },
  hardDriveCapacity: { type: String },
  color: { type: String },
  maxResolution: { type: String },
  mostSuitableFor: { type: String },
  graphicsProcessingType: { type: String },
  connectivity: { type: String },
  manufacturerWarranty: { type: String },
  regionOfManufacture: { type: String },
  height: { type: String },
  length: { type: String },
  weight: { type: String },
  width: { type: String },
  variation: { type: String },
  condition: { type: String },
  conditionDescription: { type: String },
  productDescription: { type: String },
  pricingFormat: { type: String },
  vat: { type: String },
  paymentPolicy: { type: Schema.Types.ObjectId, ref: "paymentPolicy",},
  buy2andSave: { type: String },
  buy3andSave: { type: String },
  buy4andSave: { type: String },
  shipping: {
    weight: { type: String },
    weightUnit: { type: String },
    options: [{ type: String }],
    estimatedDeliveryTime: { type: String },
  },
  description: { type: String },
  keywords: {
    relevantKeywords: [{ type: String }],
    suggestedKeywords: [{ type: String }],
  },
  fulfillmentMethod: {
    type: String,
    enum: ["Dropshipping", "In-House Fulfillment"],
  },
  identifier: { type: String },
  vatPercentage: { type: Number, default: 0 },
  salesTaxPercentage: { type: Number, default: 0 },
  applyTaxAtCheckout: { type: Boolean, default: false },
  taxConfirmation: { type: Boolean, default: false },
});

// Main Product Schema
const productSchema = new Schema<IProduct>(
  {
    platformDetails: {
      amazon: amazonSchema,
      ebay: ebaySchema,
      website: websiteSchema,
    },
    isBlocked: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true, discriminatorKey: "kind" }
);

// Base Product Model
const Product = model<IProduct>("Product", productSchema);

// Export the base Product and its discriminators
export { Product };
