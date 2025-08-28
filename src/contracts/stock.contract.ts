import mongoose, { Document } from "mongoose";
import { mediaSchema } from "@/models/listing.model";
interface IStock extends Document {
  inventoryId: mongoose.Types.ObjectId;
  productSupplier: mongoose.Types.ObjectId;
  selectedVariations?: {
    variationId: mongoose.Types.ObjectId;
    costPricePerUnit: number;
    retailPricePerUnit: number;
    purchasePricePerUnit: number;
    totalUnits: number;
    usableUnits: number;
  }[];
  priceBreakdown: {
    name: string;
    value: any;
    comment?: string;
  }[];
  stockInvoice: typeof mediaSchema;
  totalUnits?: number;
  usableUnits?: number;
  costPricePerUnit?: number;
  retailPricePerUnit?: number;
  purchasePricePerUnit?: number;

  receivedDate: Date;
  receivedBy: mongoose.Types.ObjectId; // ✅ Fixed type
  purchaseDate: Date;
  markAsStock: Boolean;

  images?: (typeof mediaSchema)[];
  videos?: (typeof mediaSchema)[];

  batchNumber: number;
}

export { IStock };
