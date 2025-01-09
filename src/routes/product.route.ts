import { productController } from "@/controllers";
import { productValidation } from "@/validations";
import { Router } from "express";

export const product = (router: Router) => {
  // TODO: productValidation.addProduct
  // Create or update a draft product
  router.post("/", productController.createDraftProduct);

  router.get(
    "/transform/:id",
    productValidation.validateId,
    productController.transformAndSendProduct
  );

  // Update a draft product by ID (subsequent steps)
  router.patch(
    "/:id",
    // productValidation.updateProduct,
    productController.updateDraftProduct
  );

  router.get("/", productController.getAllProduct);

  router.get(
    "/:id",
    productValidation.validateId,
    productController.getProductById
  );

  router.delete(
    "/:id",
    productValidation.validateId,
    productController.deleteProduct
  );

  router.patch(
    "/:id",
    productValidation.updateProduct,
    productController.updateProductById
  );

  // route for toggle block status
  router.patch("/block/:id", productController.toggleBlock);
};
