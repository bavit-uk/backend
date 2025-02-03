import mongoose, { Schema, Document } from "mongoose";

interface IPlatformVariation {
  stock: number;
  price: number;
  cpu: string;
  ram: string;
  sku: string;
  variationQuantity: number;
  variationPrice: string;
  storage: string;
  graphics: string;
  height: string;
  length: string;
  width: string;
}

export interface IVariation extends Document {
  productId: mongoose.Types.ObjectId;
  amazon?: IPlatformVariation;
  ebay?: IPlatformVariation;
  website?: IPlatformVariation;
}

const PlatformVariationSchema = new Schema<IPlatformVariation>({
  stock: { type: Number, default: 0 },
  price: { type: Number },
  cpu: { type: String },
  ram: { type: String },
  sku: { type: String },
  variationQuantity: { type: Number },
  variationPrice: { type: String },
  storage: { type: String },
  graphics: { type: String },
  height: { type: String },
  length: { type: String },
  width: { type: String },
});

const VariationSchema = new Schema<IVariation>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    amazon: PlatformVariationSchema,
    ebay: PlatformVariationSchema,
    website: PlatformVariationSchema,
  },
  { timestamps: true }
);

export const Variation = mongoose.model<IVariation>(
  "Variation",
  VariationSchema
);
