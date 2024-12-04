import { Schema, model, Types } from "mongoose";

import { IProduct } from "@/contracts/product.contract"; // Assuming the path for your product contract is correct

// Bundle Schema to manage Bundles
const bundleSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,  // Ensure each bundle has a unique name
  },
  description: {
    type: String,
    required: true,
  },
  // List of products in the bundle
  products: [{
    productId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Product',  // Reference to the Product model
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true,
      min: 1
    },
    platformDetails: {
      amazon: {
        type: Schema.Types.Mixed, // To store Amazon-specific details (price, shipping, etc.)
      },
      ebay: {
        type: Schema.Types.Mixed, // To store eBay-specific details (price, auction, etc.)
      },
      website: {
        type: Schema.Types.Mixed, // To store Website-specific details (price, fulfillment, etc.)
      },
    },
  }],
  images: [{
    url: { type: String, required: true },
    description: { type: String }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });  // Automatically manage createdAt and updatedAt fields

// Export the Bundle Model
export const Bundle = model("Bundle", bundleSchema);
