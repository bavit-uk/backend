import { authController } from "@/controllers";
import { authGuard } from "@/guards";
import { authValidation } from "@/validations";
import { Router } from "express";

export const auth = (router: Router) => {
  router.post("/login", authValidation.signIn, authController.signIn);

  router.post("/register", authValidation.signUp, authController.signUp);

  router.post("/forgot-password", authValidation.forgotPassword, authController.forgotPassword);

  router.get("/me", authGuard.isAuth, authController.me);

  router.patch("/update-password", authGuard.isAuth, authValidation.updatePassword, authController.updatePassword);
};
