// /routes/variation.routes.ts
import { Router } from "express";
import { variationController } from "@/controllers/variation.controller";

export const variations = (router: Router) => {
  router.get("/parts/:platform", variationController.getPartsByPlatform);

  router.get("/", variationController.getAllVariations);
};
