import { variationController } from "@/controllers";
import { variationValidation } from "@/validations";
import { Router } from "express";

export const variations = (router: Router) => {
  // TODO: variationValidation.addVariation
  // Create or update a draft variation
  router.post("/", variationController.createDraftVariation);




  
  // Route to create a new variation
  router.post('/', variationController.createVariation);
  
  // Route to get variations by product ID
  router.get('/product/:productId', variationController.getVariationsByProduct);

  // Update a draft variation by ID (subsequent steps)
  router.patch(
    "/:id",
    // variationValidation.updateVariation,
    variationController.updateDraftVariation
  );

  router.get("/", variationController.getAllVariation);

  router.get(
    "/:id",
    variationValidation.validateId,
    variationController.getVariationById
  );

  router.delete(
    "/:id",
    variationValidation.validateId,
    variationController.deleteVariation
  );

  router.patch(
    "/:id",
    variationValidation.updateVariation,
    variationController.updateVariationById
  );

  // route for toggle block status
  router.patch("/block/:id", variationController.toggleBlock);
};
