#!/usr/bin/env ts-node

/**
 * Manual Script: Convert eBay Orders to Order Leads (TypeScript)
 *
 * This script converts all existing eBay orders in the database to order leads.
 * It detects which eBay orders haven't been converted yet and converts them in batches.
 *
 * Usage:
 *   ts-node scripts/convert-ebay-orders-to-leads.ts
 *   ts-node scripts/convert-ebay-orders-to-leads.ts --dry-run
 *   ts-node scripts/convert-ebay-orders-to-leads.ts --batch-size 100
 *   ts-node scripts/convert-ebay-orders-to-leads.ts --limit 1000
 */

import mongoose from "mongoose";
import { program } from "commander";
import { EbayOrder, Order } from "../src/models";
import dotenv from "dotenv";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "dev"}`,
});

// Parse command line arguments
program
  .option("--dry-run", "Show what would be converted without actually converting")
  .option("--batch-size <number>", "Number of orders to process in each batch", "50")
  .option("--concurrency <number>", "Number of orders to process in parallel within each batch", "10")
  .option("--limit <number>", "Maximum number of orders to process (0 for all)", "0")
  .option("--skip <number>", "Number of orders to skip", "0")
  .option("--verbose", "Show detailed logging")
  .parse(process.argv);

const options = program.opts();

// MongoDB connection string - update this to match your environment
const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/your_database";

console.log(MONGODB_URI);

// Types
interface ConversionResult {
  status: "created" | "already_exists" | "would_create" | "error";
  order?: any;
  orderData?: any;
  error?: string;
}

interface ProcessingOptions {
  dryRun: boolean;
  batchSize: number;
  limit: number;
  skip: number;
  verbose: boolean;
}

// Helper functions for mapping eBay statuses to order statuses
function mapEbayOrderStatus(ebayStatus: string): string {
  const statusMap: Record<string, string> = {
    FULFILLED: "COMPLETED",
    IN_PROGRESS: "IN_PROGRESS",
    READY_TO_SHIP: "IN_PROGRESS",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    ON_HOLD: "ON_HOLD",
  };

  return statusMap[ebayStatus] || "PENDING_PAYMENT";
}

function mapEbayPaymentStatus(ebayPaymentStatus: string): string {
  const paymentStatusMap: Record<string, string> = {
    PAID: "PAID",
    PENDING: "PENDING",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED",
    PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
  };

  return paymentStatusMap[ebayPaymentStatus] || "PENDING";
}

/**
 * Convert eBay order to order lead
 */
async function convertEbayOrderToOrderLead(ebayOrder: any, OrderModel: any): Promise<ConversionResult> {
  try {
    // Check if this eBay order has already been converted
    const existingOrder = await OrderModel.findOne({
      externalOrderId: ebayOrder.orderId,
    });

    if (existingOrder) {
      return { status: "already_exists", order: existingOrder };
    }

    // Map eBay order data to order lead structure
    const orderData = {
      sourcePlatform: "EBAY" as const,
      externalOrderId: ebayOrder.orderId,
      externalOrderUrl: `https://www.ebay.com/ord/${ebayOrder.orderId}`,
      marketplaceFee: parseFloat(ebayOrder.totalMarketplaceFee?.value || "0"),

      // Customer information
      customer: null, // Will need to be set based on business logic
      customerId: null, // Will need to be set based on business logic
      customerDetails: {
        firstName: ebayOrder.buyer?.buyerRegistrationAddress?.fullName?.split(" ")[0] || "",
        lastName: ebayOrder.buyer?.buyerRegistrationAddress?.fullName?.split(" ").slice(1).join(" ") || "",
        email: ebayOrder.buyer?.buyerRegistrationAddress?.email || "",
        phone: ebayOrder.buyer?.buyerRegistrationAddress?.primaryPhone?.phoneNumber || "",
      },
      email: ebayOrder.buyer?.buyerRegistrationAddress?.email || "",

      // Order dates
      orderDate: new Date(ebayOrder.creationDate),
      placedAt: new Date(ebayOrder.creationDate),

      // Order status mapping
      status: mapEbayOrderStatus(ebayOrder.orderFulfillmentStatus),
      paymentStatus: mapEbayPaymentStatus(ebayOrder.orderPaymentStatus),

      // Financial information
      subtotal: parseFloat(ebayOrder.pricingSummary?.priceSubtotal?.value || "0"),
      shippingCost: parseFloat(ebayOrder.pricingSummary?.deliveryCost?.value || "0"),
      grandTotal: parseFloat(ebayOrder.pricingSummary?.total?.value || "0"),
      currency: ebayOrder.pricingSummary?.total?.currency || "USD",

      // Payment information
      paymentMethod: ebayOrder.paymentSummary?.payments?.[0]?.paymentMethod || "eBay",
      transactionId: ebayOrder.paymentSummary?.payments?.[0]?.paymentReferenceId || "",

      // Shipping information
      shippingAddress: {
        street1: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.addressLine1 || "",
        street2: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.addressLine2 || "",
        city: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.city || "",
        stateProvince:
          ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.stateOrProvince || "",
        postalCode: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.postalCode || "",
        country: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.countryCode || "",
      },

      // Items - these will be lead items since they don't have inventory/listing/stock IDs
      items:
        ebayOrder.lineItems?.map((lineItem: any) => ({
          itemId: lineItem.lineItemId,
          name: lineItem.title,
          quantity: lineItem.quantity,
          unitPrice: parseFloat(lineItem.lineItemCost?.value || "0"),
          condition: "New", // Default condition for eBay orders
          sku: lineItem.legacyItemId || "",
          itemTotal: parseFloat(lineItem.total?.value || "0"),
          discountAmount: 0,
          taxAmount: 0,
          finalPrice: parseFloat(lineItem.total?.value || "0"),
          // Note: No listingId, inventoryId, or stockId - this makes it a lead order
        })) || [],

      // Special instructions - include eBay-specific information
      specialInstructions:
        ebayOrder.buyerCheckoutNotes ||
        `eBay Order: ${ebayOrder.orderId}, Legacy ID: ${ebayOrder.legacyOrderId}, Seller: ${ebayOrder.sellerId}, Buyer: ${ebayOrder.buyer?.username}, Manual-converted: ${new Date().toISOString()}`,

      // Tracking information
      trackingNumber: "",
      trackingUrl: "",
      shippingStatus: "Pending",
      orderNumber: `ORD-${ebayOrder.orderId}`,
    };

    if (options.dryRun) {
      return { status: "would_create", orderData };
    }

    // Create the order lead
    const newOrder = new OrderModel(orderData);
    await newOrder.save();

    return { status: "created", order: newOrder };
  } catch (error: any) {
    return { status: "error", error: error.message };
  }
}

/**
 * Main conversion function
 */
async function convertEbayOrdersToLeads(): Promise<void> {
  console.log("🚀 Starting eBay Orders to Order Leads conversion...\n");

  try {
    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get total count of eBay orders
    const totalEbayOrders = await EbayOrder.countDocuments();
    console.log(`📊 Total eBay orders in database: ${totalEbayOrders}`);

    // Get count of already converted orders
    const convertedCount = await Order.countDocuments({
      sourcePlatform: "EBAY",
      externalOrderId: { $exists: true, $ne: null },
    });
    console.log(`📊 Already converted orders: ${convertedCount}`);

    const remainingCount = totalEbayOrders - convertedCount;
    console.log(`📊 Remaining orders to convert: ${remainingCount}\n`);

    if (remainingCount === 0) {
      console.log("✅ All eBay orders have already been converted to order leads!");
      return;
    }

    // Build query to find unconverted eBay orders
    const convertedOrderIds = await Order.find({
      sourcePlatform: "EBAY",
      externalOrderId: { $exists: true, $ne: null },
    })
      .select("externalOrderId")
      .lean();

    const convertedIds = convertedOrderIds.map((order: any) => order.externalOrderId);

    const query = {
      orderId: { $nin: convertedIds },
    };

    // Apply limit if specified
    const limit = parseInt(options.limit as string);
    const skip = parseInt(options.skip as string);
    const batchSize = parseInt(options.batchSize as string);

    console.log(`⚙️  Processing configuration:`);
    console.log(`   - Batch size: ${batchSize}`);
    console.log(`   - Skip: ${skip}`);
    console.log(`   - Limit: ${limit === 0 ? "All remaining" : limit}`);
    console.log(`   - Dry run: ${options.dryRun ? "Yes" : "No"}`);
    console.log("");

    // Process orders in batches
    let processed = 0;
    let converted = 0;
    let skipped = 0;
    let errors = 0;
    let currentSkip = skip;

    while (true) {
      // Fetch batch of unconverted orders
      const batch = await EbayOrder.find(query).sort({ creationDate: 1 }).skip(currentSkip).limit(batchSize).lean();

      if (batch.length === 0) {
        break;
      }

      console.log(`🔄 Processing batch ${Math.floor(currentSkip / batchSize) + 1} (${batch.length} orders)...`);

      // Process orders in parallel within the batch for better performance
      const batchResults = await Promise.allSettled(
        batch.map(async (ebayOrder) => {
          try {
            const result = await convertEbayOrderToOrderLead(ebayOrder, Order);
            return { ebayOrder, result };
          } catch (error: any) {
            return { ebayOrder, result: { status: "error", error: error.message } };
          }
        })
      );

      // Process batch results
      for (const batchResult of batchResults) {
        if (batchResult.status === "fulfilled") {
          const { ebayOrder, result } = batchResult.value;

          switch (result.status) {
            case "created":
              converted++;
              if (options.verbose) {
                console.log(`  ✅ Converted: ${ebayOrder.orderId} -> ${result.order?.orderId}`);
              }
              break;
            case "already_exists":
              skipped++;
              if (options.verbose) {
                console.log(`  ℹ️  Already exists: ${ebayOrder.orderId}`);
              }
              break;
            case "would_create":
              converted++;
              if (options.verbose) {
                console.log(`  📝 Would create: ${ebayOrder.orderId}`);
              }
              break;
            case "error":
              errors++;
              console.log(`  ❌ Error converting ${ebayOrder.orderId}: ${result.error}`);
              break;
          }

          processed++;
        } else {
          // Handle rejected promises
          errors++;
          console.log(`  ❌ Error processing batch item: ${batchResult.reason}`);
          processed++;
        }

        // Check if we've reached the limit
        if (limit > 0 && processed >= limit) {
          console.log(`\n⏹️  Reached processing limit of ${limit}`);
          break;
        }
      }

      // Update skip for next batch
      currentSkip += batchSize;

      // Check if we've reached the limit
      if (limit > 0 && processed >= limit) {
        break;
      }

      // Add small delay between batches to avoid overwhelming the database
      if (!options.dryRun) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Log batch progress
      console.log(`  📊 Batch ${Math.floor(currentSkip / batchSize)} completed: ${batch.length} orders processed`);
    }

    // Print summary
    console.log("\n📊 Conversion Summary:");
    console.log(`   - Total processed: ${processed}`);
    console.log(`   - Successfully converted: ${converted}`);
    console.log(`   - Skipped (already exists): ${skipped}`);
    console.log(`   - Errors: ${errors}`);

    if (options.dryRun) {
      console.log("\n⚠️  This was a dry run. No actual changes were made to the database.");
      console.log("   Run without --dry-run to perform the actual conversion.");
    } else {
      console.log("\n✅ Conversion completed successfully!");
    }
  } catch (error: any) {
    console.error("\n❌ Error during conversion:", error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n\n⏹️  Conversion interrupted by user");
  await mongoose.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n\n⏹️  Conversion terminated");
  await mongoose.disconnect();
  process.exit(0);
});

// Run the conversion
if (require.main === module) {
  convertEbayOrdersToLeads().catch(console.error);
}

export { convertEbayOrdersToLeads };
