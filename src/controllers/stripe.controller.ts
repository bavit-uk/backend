import { Request, Response } from "express";
import Stripe from "stripe";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { userService } from "@/services";
import { IContextRequest, IUserRequest } from "@/contracts/request.contract";
import { socketManager } from "@/datasources/socket.datasource";

const handleError = (res: Response, error: unknown) => {
  console.error("Stripe API Error:", error);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    message: ReasonPhrases.INTERNAL_SERVER_ERROR,
    error: error instanceof Error ? error.message : "An unknown error occurred",
  });
};

const getStripeInstance = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

export const stripeController = {
  createSubscription: async (req: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const { user } = req.context;

      if (user.subscriptionId && user.isSubscriptionActive) {
        return res.status(StatusCodes.CONFLICT).json({
          status: StatusCodes.CONFLICT,
          message: ReasonPhrases.CONFLICT,
        });
      }

      // Check with Stripe if the user has a subscription
      if (user.stripeCustomerId) {
        const stripe = getStripeInstance();
        const subscription = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          price: process.env.STRIPE_PRICE_ID,
          status: "active",
        });

        if (subscription.data.length > 0) {
          if (!user.subscriptionId) {
            await userService.updateSubscriptionId(user.id, subscription.data[0].id);
          }
          if (!user.isSubscriptionActive) {
            const currentPeriodStart = subscription.data[0].current_period_start;
            const startDate = new Date(currentPeriodStart * 1000);
            const currentPeriodEnd = subscription.data[0].current_period_end;
            const endDate = new Date(currentPeriodEnd * 1000);
            await userService.activateSubscription(user.stripeCustomerId, startDate, endDate);
          }

          return res.status(StatusCodes.CONFLICT).json({
            status: StatusCodes.CONFLICT,
            message: ReasonPhrases.CONFLICT,
          });
        }
      }

      let stripeCustomerId = user.stripeCustomerId;

      const stripe = getStripeInstance();

      if (!stripeCustomerId) {
        const stripeCustomerObject = await stripe.customers.create({ email: user.email, name: user.name });
        stripeCustomerId = stripeCustomerObject.id;
        await userService.updateStripeCustomerId(user.id, stripeCustomerId);
      }

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: process.env.STRIPE_PRICE_ID }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      await userService.updateSubscriptionId(user.id, subscription.id);

      const clientSecret =
        subscription.latest_invoice &&
        typeof subscription.latest_invoice !== "string" &&
        subscription.latest_invoice.payment_intent &&
        typeof subscription.latest_invoice.payment_intent !== "string"
          ? subscription.latest_invoice.payment_intent.client_secret
          : undefined;

      res.status(StatusCodes.CREATED).json({
        status: StatusCodes.CREATED,
        message: ReasonPhrases.CREATED,
        subscriptionId: subscription.id,
        clientSecret,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  getSubscription: async (req: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const { user } = req.context;

      if (!user.subscriptionId) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const stripe = getStripeInstance();
      const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
      res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        subscription,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  cancelSubscription: async (req: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const { user } = req.context;

      if (!user.subscriptionId) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const stripe = getStripeInstance();
      const canceledSubscription = await stripe.subscriptions.cancel(user.subscriptionId);
      res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        subscription: canceledSubscription,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  listSubscriptions: async (req: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const { user } = req.context;

      if (!user.stripeCustomerId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
        });
      }

      const stripe = getStripeInstance();
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "all",
        expand: ["data.default_payment_method"],
      });
      res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        subscriptions: subscriptions.data,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  listInvoices: async (req: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const { user } = req.context;

      if (!user.stripeCustomerId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
        });
      }

      const stripe = getStripeInstance();
      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        expand: ["data.subscription.default_payment_method"],
      });

      const customerInvoices = invoices?.data?.map((invoice) => {
        return {
          id: invoice.id,
          amount: invoice.amount_due,
          date: invoice.created,
          status: invoice.status,
          subscription: (invoice.subscription as Stripe.Subscription)?.id,
          paymentBrand: ((invoice.subscription as Stripe.Subscription)?.default_payment_method as Stripe.PaymentMethod)
            ?.card?.brand,
          paymentLast4: ((invoice.subscription as Stripe.Subscription)?.default_payment_method as Stripe.PaymentMethod)
            ?.card?.last4,
          invoiceURL: invoice.hosted_invoice_url,
          downloadURL: invoice.invoice_pdf,
        };
      });

      res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: customerInvoices || [],
        // data: invoices.data,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  createPortalSession: async (req: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const { user } = req.context;

      if (!user.stripeCustomerId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
        });
      }

      const stripe = getStripeInstance();
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
      });
      res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        url: session.url,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  webhookHandler: async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;
    const stripe = getStripeInstance();

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err) {
      console.log("Invalid webhook signature");
      console.error(err);
      res
        .status(StatusCodes.BAD_REQUEST)
        .send(`Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`);
      return;
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment intent, ", paymentIntent);
        const paymentIntentCustomerId = paymentIntent.customer as string;
        await stripeController.sendSocketEvent(
          paymentIntentCustomerId,
          "activate_subscription",
          "payment_intent.succeeded"
        );
        await userService.activateSubscription(paymentIntentCustomerId);

        console.log("Payment was successful!");
        break;
      case "subscription_schedule.canceled":
        const subscription = await stripe.subscriptions.retrieve(event.data.object.id as string);
        console.log("Subscription, ", subscription);
        const subscriptionCustomerId = subscription.customer as string;
        await stripeController.sendSocketEvent(
          subscriptionCustomerId,
          "deactivate_subscription",
          "subscription_schedule.canceled"
        );
        await userService.deactivateSubscription(subscriptionCustomerId);
        console.log("Subscription was canceled!");
        break;
      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log("Deleted subscription, ", deletedSubscription);
        const deletedSubscriptionCustomerId = deletedSubscription.customer as string;
        await stripeController.sendSocketEvent(
          deletedSubscriptionCustomerId,
          "deactivate_subscription",
          "customer.subscription.deleted"
        );
        await userService.deactivateSubscription(deletedSubscriptionCustomerId);
        break;

      case "customer.subscription.paused":
        const pausedSubscription = event.data.object as Stripe.Subscription;
        console.log("Paused subscription, ", pausedSubscription);
        const pausedSubscriptionCustomerId = pausedSubscription.customer as string;
        await stripeController.sendSocketEvent(
          pausedSubscriptionCustomerId,
          "deactivate_subscription",
          "customer.subscription.paused"
        );
        await userService.deactivateSubscription(pausedSubscriptionCustomerId);
        break;

      case "customer.subscription.resumed":
        const resumedSubscription = event.data.object as Stripe.Subscription;
        console.log("Resumed subscription, ", resumedSubscription);
        const resumedSubscriptionCustomerId = resumedSubscription.customer as string;
        await stripeController.sendSocketEvent(
          resumedSubscriptionCustomerId,
          "activate_subscription",
          "customer.subscription.resumed"
        );
        await userService.activateSubscription(resumedSubscriptionCustomerId);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: ReasonPhrases.OK });
  },

  sendSocketEvent: async (stripeCustomerId: string, event: string, eventCode?: string) => {
    const io = socketManager.getIo();
    if (!io) return;

    const user = await userService.getUserByStripeCustomerId(stripeCustomerId);

    if (!user) return;

    const socketId = socketManager.getSocketId(user.id);

    if (!socketId) return;

    io.to(socketId).emit(event, eventCode);

    // Send socket event to client
  },
};
