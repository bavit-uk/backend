import { Request, Response } from 'express';
import { VariationService } from '../services/variation.service';

const variationService = new VariationService();

export class VariationController {
  async createVariation(req: Request, res: Response) {
    try {
      const variation = await variationService.createVariation(req.body);
      res.status(201).json(variation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getVariationsByProduct(req: Request, res: Response) {
    try {
      const productId = req.params.productId;
      const variations = await variationService.getVariationsByProductId(productId);
      res.json(variations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
