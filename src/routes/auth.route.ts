import { authController } from "@/controllers";
import { authGuard } from "@/guards";
import { authMiddleware } from "@/middlewares";
import { authValidation } from "@/validations";
import { Router } from "express";

export const auth = (router: Router) => {
  router.post("/login", authValidation.signIn, authController.signIn);

  router.post("/register", authValidation.signUp, authController.signUp);

  router.get("/refresh-token", authMiddleware, authGuard.isAuth, authController.refreshToken);

  router.post("/forgot-password", authValidation.forgotPassword, authController.forgotPassword);

  router.get("/me", authMiddleware, authGuard.isAuth, authController.me);

  router.patch("/update-password", authGuard.isAuth, authValidation.updatePassword, authController.updatePassword);
};
