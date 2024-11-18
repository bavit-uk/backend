import { Router } from "express";
import { authController } from "@/controllers";
import { authValidation } from "@/validations";
// import passport from "../passport"

export const auth = (router:Router) =>{

    // Route for user registration
    router.post("/register", authValidation.registerUser , authController.registerUser);

    router.post("/login", authValidation.loginUser , authController.loginUser);

    router.post("/forgot-password" , authValidation.forgotPassword , authController.forgotPassword)

    // router.get("/google" , passport.authenticate("google" , {scope: ["profile" , "email"]}))

    // router.get("/google/callback" , passport.authenticate("google" ,  {
    //     failureRedirect: "/login", // Redirect if authentication fails
    //     session: false,            // Disable sessions as we're using JWT
    // }) , authController.googleAuth)

    // Route for user login

} 
