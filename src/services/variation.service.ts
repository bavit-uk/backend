import { Variation } from "@/models";

export class VariationService {
  async createVariation(variationData: any) {
    const variation = new Variation(variationData);
    return variation.save();
  }

  async getVariationsByProductId(productId: any) {
    return Variation.find({ product: productId }).populate(
      "cpu ram storage graphics"
    );
  }
}
