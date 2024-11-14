import { Router } from "express";
import { userController } from "@/controllers";
import { userValidation } from "@/validations";

export const user = (router: Router) => {

    // route for create new user 
    router.post("/create", userValidation.createUser , userController.createUser);

    // route for create new user category 
    router.post("/create-category", userValidation.createUserCategory , userController.createUserCategory); 

    // route for get all users 
    router.get("/all-users" , userController.allUsers)

    // route for get all users category 
    router.get('/categories' , userController.allUsersCategories)

    // route for get details of specific user through id
    router.get("/:id" , userController.getUserDetails)    

}

