import { productController } from "@/controllers";
import { Router } from "express";


export const product = (router: Router) => {

    router.post("/", productController.addProduct);

    router.get("/", productController.getAllProduct);

    router.get("/:id" , productController.getProductById);

    // TODO: Working on update product
    router.patch(":/id" , productController.updateProductById)

}