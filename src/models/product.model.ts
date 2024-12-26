import mongoose, { Schema, model, Types } from "mongoose";
import {
  IAmazonPlatformDetails,
  IEbayPlatformDetails,
  IProduct,
  IWebsitePlatformDetails,
} from "@/contracts/product.contract"; // Adjust the path if necessary

const options = { discriminatorKey: "kind" };

// Amazon-specific fields
const amazonSchema = new Schema<IAmazonPlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "productCategory", required: true },
  screenSize:{ type: String, required: true },
  productCondition:{ type: String, required: true },
  nonNewConditionDetails:{ type: String, required: true },
  images: [{ type: String, required: true }], // Image URLs
  // condition: {
  //   status: { type: String, enum: ["New", "Refurbished", "Used"] }, // Added enum for consistency
  //   details: { type: String },
  // },
  // technicalSpecifications: {
  //   processorType: { type: String },
  //   motherboard: { type: String }, // Added motherboard
  //   cpuFan: { type: String }, // Added CPU fan
  //   case: { type: String }, // Added case
  //   accessoriesExpansionsNetworking: { type: String }, // Added Accessories/Expansions/Networking
  //   ramSize: { type: String },
  //   storageDetails: { type: String },
  //   graphicsCard: { type: String }, // Added Graphics Card
  //   operatingSystem: { type: String },
  //   additionalSpecifications: { type: String },
  // },
  // quantity: { type: Number, },
  // pricing: {
    variation: { type: String },
    condition: { type: String },
    conditionDescription: { type: String },
    productDescription: { type: String },
    pricingFormat: { type: String },
    vat: { type: String },
    paymentPolicy: { type: String },
    buy2andSave: { type: String },
    buy3andSave: { type: String },
    buy4andSave: { type: String },
    
    // discountPrice: { type: Number },
  // },
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
  identifier: { type: String }, // UPC, EAN, ISBN
  vatPercentage: { type: Number, default: 0 }, // VAT Percentage
  salesTaxPercentage: { type: Number, default: 0 }, // Sales Tax Percentage
  applyTaxAtCheckout: { type: Boolean }, // Apply Tax at checkout flag
  taxConfirmation: { type: Boolean }, // Tax confirmation flag
});

// eBay-specific fields
const ebaySchema = new Schema<IEbayPlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "productCategory", required: true },
  screenSize:{ type: String, required: true },
  productCondition:{ type: String, required: true },
  nonNewConditionDetails:{ type: String, required: true },
  images: [{ type: String, required: true }], // Image URLs
  // technicalSpecifications: {
  //   modelNumber: { type: String },
  //   motherboard: { type: String }, // Added motherboard
  //   cpuFan: { type: String }, // Added CPU fan
  //   case: { type: String }, // Added case
  //   accessoriesExpansionsNetworking: { type: String }, // Added Accessories/Expansions/Networking
  //   ramSize: { type: String },
  //   storageDetails: { type: String },
  //   graphicsCard: { type: String }, // Added Graphics Card
  //   operatingSystem: { type: String },
  //   additionalSpecifications: { type: String },
  // },
  // quantity: { type: Number },
  // pricing: {
    variation: { type: String },
    condition: { type: String },
    conditionDescription: { type: String },
    productDescription: { type: String },
    pricingFormat: { type: String },
    vat: { type: String },
    paymentPolicy: { type: String },
    buy2andSave: { type: String },
    buy3andSave: { type: String },
    buy4andSave: { type: String },
    // pricePerUnit: { type: Number },
    // discountPrice: { type: Number },
    // purchasePrice: { type: Number },
    // buyItNowPrice: { type: Number }, // Already present
    // auctionStartingPrice: { type: Number }, // Already present
  // },
  // condition: {
  //   status: { type: String, enum: ["New", "Refurbished", "Used"] }, // Added enum
  //   details: { type: String },
  // },
  shipping: {
    weight: { type: String },
    options: [{ type: String }],
    estimatedDeliveryTime: { type: String },
    handlingTime: { type: String }, // Already present
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
  identifier: { type: String }, // UPC, EAN, ISBN
  vatPercentage: { type: Number, default: 0 }, // VAT Percentage
  salesTaxPercentage: { type: Number, default: 0 }, // Sales Tax Percentage
  applyTaxAtCheckout: { type: Boolean }, // Apply Tax at checkout flag
  taxConfirmation: { type: Boolean }, // Tax confirmation flag
});

// Website-specific fields
const websiteSchema = new Schema<IWebsitePlatformDetails>({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "productCategory", required: true },
  screenSize:{ type: String, required: true },
  productCondition:{ type: String, required: true },
  nonNewConditionDetails:{ type: String, required: true },
  images: [{ type: String, required: true }], // Image URLs
  // technicalSpecifications: {
  //   modelNumber: { type: String },
  //   motherboard: { type: String }, // Added motherboard
  //   cpuFan: { type: String }, // Added CPU fan
  //   case: { type: String }, // Added case
  //   accessoriesExpansionsNetworking: { type: String }, // Added Accessories/Expansions/Networking
  //   ramSize: { type: String },
  //   storageDetails: { type: String },
  //   graphicsCard: { type: String }, // Added Graphics Card
  //   operatingSystem: { type: String },
  //   additionalSpecifications: { type: String },
  // },  
  // quantity: { type: Number },
  // pricing: {
    variation: { type: String },
    condition: { type: String },
    conditionDescription: { type: String },
    productDescription: { type: String },
    pricingFormat: { type: String },
    vat: { type: String },
    paymentPolicy: { type: String },
    buy2andSave: { type: String },
    buy3andSave: { type: String },
    buy4andSave: { type: String },
    // pricePerUnit: { type: Number },
    // purchasePrice: { type: Number },
    // discountPrice: { type: Number },
  // },
  // condition: {
  //   status: { type: String, enum: ["New", "Refurbished", "Used"] }, // Added enum
  //   details: { type: String },
  // },
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
  identifier: { type: String }, // UPC, EAN, ISBN
  vatPercentage: { type: Number, default: 0 }, // VAT Percentage
  salesTaxPercentage: { type: Number, default: 0 }, // Sales Tax Percentage
  applyTaxAtCheckout: { type: Boolean, default: false }, // Apply Tax at checkout flag
  taxConfirmation: { type: Boolean, default: false }, // Tax confirmation flag
});

// Main Product Schema
const productSchema = new Schema<IProduct>(
  {
    // name: { type: String  , required: true},
    platformDetails: {
      amazon: amazonSchema, // Amazon-specific details
      ebay: ebaySchema, // eBay-specific details
      website: websiteSchema, // Website-specific details
    },
    isBlocked: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "draft" }, // Product status
  },
  options
  // { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

// Product Model
const Product = model<IProduct>("Product", productSchema);

Product.discriminator(
  "PC",
  new mongoose.Schema(
    {
      processor: {type: String},
      model: {type: String},
      operatingSystem: { type: String },
      storageType: { type: String },
      features: { type: String },
      ssdCapacity: { type: String },
      gpu: { type: String },
      type: { type: String },
      releaseYear: { type: String },
      hardDriveCapacity: { type: String },
      color: { type: String },
      maxResolutions: { type: String },
      mostSuitableFor: { type: String },
      graphicsProcessingType: { type: String },
      connectivity: { type: String },
      manufacturerWarranty: { type: String },
      regionOfManufacture: { type: String },
      height: { type: String },
      length: { type: String },
      weight: { type: String },
      width: { type: String },
      // processorSpeed: { type: String },
      // mpn: { type: String },
      // unitQuantity: { type: String },
      // unitType: { type: String },
      // series: { type: String },
      // ramSize: { type: String },
      // mostSuitableFor: { type: String },
      // graphicsProcessingType: { type: String },
      // productD: { type: String },
      // motherboard: { type: String }, // Added motherboard
      // cpuFan: { type: String }, // Added CPU fan
      // case: { type: String }, // Added case
      // accessories: { type: String }, // Added Accessories/Expansions/Networking
      // expansionsNetworking: { type: String }, // Added Accessories/Expansions/Networking
      // additionalSpecifications: { type: String },

      // modelNumber: { type: String },
    },
    options
  )
);


Product.discriminator(
  "Projector",
  new mongoose.Schema(
    {
      resolution: String,
      lumens: String,
      contrast: String,
    },
    options
  )
);


export {Product}