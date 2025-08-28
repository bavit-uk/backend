import { Router } from "express";
import { EbayChatService } from "@/services/ebay-chat.service";

export const ebayChat = (router: Router) => {
  // Send a message to a buyer
  router.post("/send", EbayChatService.sendMessage);

  // Get messages for a specific item and buyer
  router.get("/messages/:ebayItemId/:buyerUsername", EbayChatService.getMessages);

  // Get all conversations for a seller
  router.get("/conversations", EbayChatService.getConversations);
  router.get("/conversations/:sellerUsername", EbayChatService.getConversations);

  // Mark a specific message as read
  router.patch("/messages/:messageId/read", EbayChatService.markAsRead);

  // Mark all messages in a conversation as read
  router.patch("/conversations/:ebayItemId/:buyerUsername/read", EbayChatService.markConversationAsRead);

  // Sync messages from eBay API
  router.post("/sync", EbayChatService.syncEbayMessages);
  router.post("/sync/:sellerUsername", EbayChatService.syncEbayMessages);

    // Search messages
    router.get("/search", authGuard.isAuth as any, EbayChatController.searchMessages);
    router.get("/search/:sellerUsername", authGuard.isAuth as any, EbayChatController.searchMessages);

    // Get order list from local database
    router.get("/orders", authGuard.isAuth as any, EbayChatController.getOrderList);
    router.get("/orders/:sellerUsername", authGuard.isAuth as any, EbayChatController.getOrderList);

    // Get eBay orders directly from API
    router.get("/ebay-orders", authGuard.isAuth as any, EbayChatController.getEbayOrders);
    router.get("/ebay-orders/:sellerUsername", authGuard.isAuth as any, EbayChatController.getEbayOrders);

    // Get orders using existing eBay listing service (for comparison/testing)
    router.get("/orders-listing-service", authGuard.isAuth as any, async (req, res) => {
      try {
        console.log("=== ORDERS LISTING SERVICE DEBUG ===");
        console.log("Request headers:", req.headers);
        console.log("Request query:", req.query);
        console.log("Request params:", req.params);

        const { ebayListingService } = await import("@/services");
        console.log("eBay listing service imported successfully");

        await ebayListingService.getOrders(req, res);
        console.log("eBay listing service getOrders completed");
      } catch (error: any) {
        console.error("Error getting orders:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
          success: false,
          message: "Failed to retrieve orders",
          error: error.message,
          stack: error.stack
        });
      }
    });

    // Get orders using existing eBay listing service without auth (for testing)
    router.get("/orders-listing-service-test", async (req, res) => {
      try {
        console.log("=== ORDERS LISTING SERVICE TEST (NO AUTH) ===");
        const { ebayListingService } = await import("@/services");
        await ebayListingService.getOrders(req, res);
      } catch (error: any) {
        console.error("Error getting orders (no auth):", error);
        res.status(500).json({
          success: false,
          message: "Failed to retrieve orders",
          error: error.message
        });
      }
    });

    // Get orders without auth for testing
    router.get("/orders-test", async (req, res) => {
      try {
        const { ebayListingService } = await import("@/services");
        await ebayListingService.getOrders(req, res);
      } catch (error: any) {
        console.error("Error getting orders:", error);
        res.status(500).json({
          success: false,
          message: "Failed to retrieve orders",
          error: error.message
        });
      }
    });
};