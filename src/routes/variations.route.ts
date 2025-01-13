import { variationController } from "@/controllers";
import { variationValidation } from "@/validations";
import { Router } from "express";

export const variations = (router: Router) => {
  // TODO: variationValidation.addVariation
  // Create or update a draft variation
  router.post("/", variationController.createDraftVariation);

  router.get(
    "/transform/:id",
    variationValidation.validateId,
    variationController.transformAndSendVariation
  );
  // Fetch transformed template variation by ID
  router.get(
    "/templates/:id",
    variationValidation.validateId,
    variationController.transformAndSendTemplateVariation
  );

  // Fetch all template variations
  router.get("/templates", variationController.getAllTemplateVariations);

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
