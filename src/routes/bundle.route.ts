import { bundleController } from "@/controllers"; // Assuming you have a bundle controller
import { Router } from "express";

export const bundle = (router: Router) => {
  
  // Route to create a new bundle
  router.post("/", bundleController.addBundle);

  // Route to get all bundles
  router.get("/", bundleController.getAllBundles);

  // Route to get a specific bundle by ID
  router.get("/:id", bundleController.getBundleById);

  // Route to update a bundle by ID
  router.patch("/:id", bundleController.updateBundleById);

  // Route to delete a bundle by ID
  router.delete("/:id", bundleController.deleteBundleById);
};
//todo fix, auth guard , validators