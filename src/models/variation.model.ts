import mongoose, { Schema, model } from "mongoose";

const options = { timestamps: true };

const variationSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    platform: {
      type: String,
      enum: ["amazon", "ebay", "website"],
      required: true,
    },
    stock: { type: Number, default: 0 },
    price: { type: Number, required: true },
    cpu: { type: String, required: true },
    ram: { type: String, required: true },
    sku: { type: String, required: true },
    variationQuantity: { type: Number, required: true },
    variationPrice: { type: String, required: true },
    storage: { type: String, required: true },
    graphics: { type: String, required: true },
    height: { type: String },
    length: { type: String },
    width: { type: String },
  },
  options
);

export const Variation = model("Variation", variationSchema);
