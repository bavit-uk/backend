import { Router } from "express";
import { userCategoryController } from "@/controllers";
import { userCategoryValidation } from "@/validations";

export const userCategory = (router: Router) => {

    // route for create new user category 
    router.post("/", userCategoryValidation.createUserCategory , userCategoryController.createUserCategory); 

    // route for get all users category 
    router.get("/" , userCategoryController.allUsersCategories)

}
