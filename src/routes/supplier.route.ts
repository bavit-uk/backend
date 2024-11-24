import { Router } from "express";
import { supplierController } from "@/controllers";
import { supplierValidation } from "@/validations";

export const supplier = (router:Router) => {

    router.post("/" , supplierValidation.addSupplier , supplierController.addSupplier)

    // router.patch("/:id" , supplierValidation.validateId , supplierController.editSupplier)

    router.get("/" , supplierController.getSuppliers)

    router.get("/:id" , supplierValidation.validateId , supplierController.getSupplierById)

}

