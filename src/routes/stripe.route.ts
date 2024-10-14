import { stripeController } from "@/controllers/stripe.controller";
import { authGuard } from "@/guards";
import { Router } from "express";
import express from "express";

export const stripe = (router: Router) => {
  router.post("/create-subscription", authGuard.isAuth, stripeController.createSubscription);
  router.delete("/cancel-subscription", authGuard.isAuth, stripeController.cancelSubscription);
  router.get("/invoices", authGuard.isAuth, stripeController.listInvoices);
  // router.post("/handle-webhook", stripeController.webhookHandler);
  // router.post("/create-payment-intent", stripeController.createPaymentIntent);
};
