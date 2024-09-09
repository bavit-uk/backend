import { authController } from "@/controllers";
import { authGuard } from "@/guards";
import { authMiddleware } from "@/middlewares";
import { authValidation } from "@/validations";
import { Router } from "express";

export const auth = (router: Router) => {
  router.post("/login", authValidation.signIn, authController.signIn);

  router.post("/register", authValidation.signUp, authController.signUp);

  router.get("/refresh-token", authMiddleware, authGuard.isAuth, authController.refreshToken);

  router.post("/request-password-reset", authValidation.forgotPassword, authController.forgotPassword);

  router.post("/reset-password", authValidation.resetPassword, authController.resetPassword);

  router.get("/me", authMiddleware, authGuard.isAuth, authController.me);

  router.patch("/update-password", authGuard.isAuth, authValidation.updatePassword, authController.updatePassword);

  router.post(
    "/request-email-verification",
    authValidation.requestEmailVerification,
    authController.requestEmailVerification
  );

  router.post("/verify-email", authValidation.verifyEmail, authController.verifyEmail);
};
