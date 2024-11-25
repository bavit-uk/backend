import { Router } from "express";
import { userController } from "@/controllers";
import { userValidation } from "@/validations";
import { authGuard } from "@/guards";

export const user = (router: Router) => {

    // route for create new user 
    router.post("/", userValidation.createUser , userController.createUser);

    // route for get all users 
    router.get("/" , userController.allUsers)

    // route for get details (include permissions) of specific user through id
    router.get("/:id" ,  userValidation.validateId ,userController.getUserDetails)

    // route for update user 
    router.patch("/:id" , userValidation.updateUser ,userController.updateUser)

    // route for delete user using id
    router.delete("/:id" , userValidation.validateId , userController.deleteUser )

    router.patch("/block/:id" , userController.toggleBlock)
}


