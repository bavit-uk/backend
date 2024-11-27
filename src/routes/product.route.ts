import { productController } from "@/controllers";
import { Router } from "express";


export const product = (router: Router) => {

    router.post("/", productController.addProduct);

    router.get("/", productController.getAllProduct);

    router.get("/:id" , productController.getProductById);

}