// /models/variation.model.ts
import mongoose, { Schema, model } from "mongoose";

const options = { timestamps: true };

// Shared fields for variations
const sharedVariationFields = {
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variationName: { type: String, required: true },
  stock: { type: Number, default: 0 },
  price: { type: Number, required: true },
  cpu: { type: String, required: true },
  ram: { type: String, required: true },
  storage: { type: String, required: true },
  graphics: { type: String, required: true },
  height: { type: String },
  length: { type: String },
  width: { type: String },
};

// Amazon variation schema
const amazonVariationSchema = new Schema(
  {
    ...sharedVariationFields,
    productId: { type: Schema.Types.ObjectId, ref: "ProductAmazon" },
  },
  options
);

// eBay variation schema
const ebayVariationSchema = new Schema(
  {
    ...sharedVariationFields,
    productId: { type: Schema.Types.ObjectId, ref: "ProductEbay" },
  },
  options
);

// Website variation schema
const websiteVariationSchema = new Schema(
  {
    ...sharedVariationFields,
    productId: { type: Schema.Types.ObjectId, ref: "ProductWebsite" },
  },
  options
);

export const AmazonVariation = model("AmazonVariation", amazonVariationSchema);
export const EbayVariation = model("EbayVariation", ebayVariationSchema);
export const WebsiteVariation = model(
  "WebsiteVariation",
  websiteVariationSchema
);
