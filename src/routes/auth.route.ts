import { authController } from "@/controllers";
import { authGuard } from "@/guards";
import { authValidation } from "@/validations";
import { Router } from "express";

export const auth = (router: Router) => {
  router.post("/login", authValidation.signIn, authController.signIn);

  router.post("/login-with-qr", authValidation.signInWithQrCode, authController.signInWithQrCode);

  router.post("/register", authValidation.signUp, authController.signUp);

  router.get("/refresh-token", authGuard.isAuth, authController.refreshToken);

  router.post("/request-password-reset", authValidation.forgotPassword, authController.forgotPassword);

  router.post("/verify-otp", authValidation.verifyOtp, authController.verifyOtp);

  router.post("/reset-password", authValidation.resetPassword, authController.resetPassword);

  router.get("/me", authGuard.isAuth, authController.me);

  router.patch("/update-profile", authGuard.isAuth, authValidation.updateProfile, authController.updateProfile);

  router.patch("/update-fcm-token", authGuard.isAuth, authValidation.updateFcmToken, authController.updateFcmToken);

  router.patch(
    "/modify-login-status",
    authGuard.isAuth,
    authValidation.modifyLoginStatus,
    authController.modifyLoginStatus
  );

  router.patch(
    "/modify-notification-status",
    authGuard.isAuth,
    authValidation.modifyNotificationStatus,
    authController.modifyNotificationStatus
  );

  router.patch("/update-password", authGuard.isAuth, authValidation.updatePassword, authController.updatePassword);

  router.post(
    "/request-email-verification",
    authValidation.requestEmailVerification,
    authController.requestEmailVerification
  );

  router.post("/verify-email", authValidation.verifyEmail, authController.verifyEmail);

  router.delete("/delete-profile", authGuard.isAuth, authValidation.deleteProfile, authController.deleteProfile);
};
