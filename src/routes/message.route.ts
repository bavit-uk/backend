import { messageController } from "@/controllers";
import { authGuard } from "@/guards";
import { Router } from "express";

export const message = (router: Router) => {
  router.get("/sent", authGuard.isAuth, messageController.getAllSentByUser);
  router.get("/received", authGuard.isAuth, messageController.getAllReceivedByUser);
};
