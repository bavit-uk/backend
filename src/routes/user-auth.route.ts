import { Router } from "express";
import { authController } from "@/controllers";
import { authValidation } from "@/validations";
import { authGuard } from "@/guards";
// import passport from "../passport"

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3M2MzYzI4Y2IyYjYzYTcyM2RjMWE5NCIsImlhdCI6MTczMjAyMTU4MiwiZXhwIjoxNzMyMDI1MTgyfQ.WqzOxUt7oYO_14HjaKa3j_N0txF9KEzt8IJiYJBwLYU

export const auth = (router: Router) => {
  // Route for user registration
  router.post("/register", authValidation.registerUser, authController.registerUser);

  router.post("/login", authValidation.loginUser, authController.loginUser);

  router.get("/profile", authGuard.isAuth, authController.getProfile);

  router.patch("/update-profile", authValidation.updateProfile, authGuard.isAuth, authController.updateProfile);

  router.post("/forgot-password", authValidation.forgotPassword, authController.forgotPassword);

  router.post("/reset-password/:token", authValidation.resetPassword, authController.resetPassword);
};

// router.get("/google" , passport.authenticate("google" , {scope: ["profile" , "email"]}))

// router.get("/google/callback" , passport.authenticate("google" ,  {
//     failureRedirect: "/login", // Redirect if authentication fails
//     session: false,            // Disable sessions as we're using JWT
// }) , authController.googleAuth)

// Route for user login
