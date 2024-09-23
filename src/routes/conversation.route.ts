import { conversationController } from "@/controllers";
import { authGuard } from "@/guards";
import { conversationValidation } from "@/validations";
import { Router } from "express";

export const conversation = (router: Router) => {
  router.use(authGuard.isAuth);
  router.get("/", conversationController.getConversations);
  router.post("/", conversationValidation.createConversation, conversationController.createConversation);
  router.get("/:conversationId", conversationValidation.getConversation, conversationController.getConversation);
  router.patch(
    "/:conversationId",
    conversationValidation.updateConversation,
    conversationController.updateConversation
  );
  router.delete(
    "/:conversationId",
    conversationValidation.deleteConversation,
    conversationController.deleteConversation
  );
  router.get("/:conversationId/messages", conversationValidation.getMessages, conversationController.getMessages);
  router.patch(
    "/:conversationId/block",
    conversationValidation.blockConversation,
    conversationController.blockConversation
  );
  router.patch(
    "/:conversationId/unblock",
    conversationValidation.unblockConversation,
    conversationController.unblockConversation
  );
};
