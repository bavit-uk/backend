import mongoose from "mongoose";

const variationSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  cpu: { type: mongoose.Schema.Types.ObjectId, ref: "Part", required: true },
  ram: { type: mongoose.Schema.Types.ObjectId, ref: "Part", required: true },
  storage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Part",
    required: true,
  },
  graphics: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Part",
    required: true,
  },
  price: { type: Number, required: true },
  description: { type: String },
});

export const Variation = mongoose.model("Variation", variationSchema);
