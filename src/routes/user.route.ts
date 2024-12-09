import { Router } from "express";
import { userController } from "@/controllers";
import { userValidation } from "@/validations";
import { authGuard } from "@/guards";

export const user = (router: Router) => {

    // route for create new user 
    router.post("/" , userValidation.createUser , userController.createUser);

    // route for get all users 
    router.get("/" , authGuard.isAuth , userController.allUsers)

    // route for get details (include permissions) of specific user by id
    router.get("/:id" ,  userValidation.validateId ,userController.getUserDetails)

    router.get("/address/:id" , userController.getUserAddress)

    // route for update user 
    // TODO: , userValidation.updateUser  add validation
    router.patch("/:id" , userValidation.updateUser ,userController.updateUser)

    // route for delete user using id
    router.delete("/:id" , userValidation.validateId , userController.deleteUser )

    // route for toggle block status
    router.patch("/block/:id" , userController.toggleBlock)
}


