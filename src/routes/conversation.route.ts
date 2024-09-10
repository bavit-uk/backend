import { conversationController } from "@/controllers";
import { authGuard } from "@/guards";
import { authMiddleware } from "@/middlewares";
import { Router } from "express";

export const auth = (router: Router) => {
  router.get("/", authMiddleware, authGuard.isAuth, conversationController.getConversations);
  router.post("/", authMiddleware, authGuard.isAuth, conversationController.createConversation);
  router.get("/:conversationId", authMiddleware, authGuard.isAuth, conversationController.getConversation);
  router.patch("/:conversationId", authMiddleware, authGuard.isAuth, conversationController.updateConversation);
  router.delete("/:conversationId", authMiddleware, authGuard.isAuth, conversationController.deleteConversation);
  router.get("/:conversationId/messages", authMiddleware, authGuard.isAuth, conversationController.getMessages);
  router.patch("/:conversationId/block", authMiddleware, authGuard.isAuth, conversationController.blockConversation);
  router.patch(
    "/:conversationId/unblock",
    authMiddleware,
    authGuard.isAuth,
    conversationController.unblockConversation
  );
};
