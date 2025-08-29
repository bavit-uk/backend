import cron from "node-cron";
import { EbayCronLog, EbayOrder } from "@/models";
import { getStoredEbayAccessToken } from "@/utils/ebay-helpers.util";

export const ebayOrderSyncCron = () => {
  // Run every 10 minutes (fixed the comment)
  cron.schedule("*/10 * * * *", async () => {
    const jobId = `ebay_order_sync_${Date.now()}`;
    const startTime = new Date();

    try {
      console.log("🔄 Starting eBay order sync cron job...");

      // Create initial log entry
      const cronLog = await EbayCronLog.create({
        jobId,
        jobType: "order_sync",
        jobName: "eBay Order Sync",
        startTime,
        status: "running",
        sellerUsername: process.env.EBAY_SELLER_USERNAME,
        environment: process.env.EBAY_TOKEN_ENV === "production" ? "production" : "sandbox",
        tags: ["ebay", "orders", "sync"],
        metadata: {
          cronExpression: "*/10 * * * *",
          description: "Syncs orders from eBay API every 10 minutes",
        },
      });

      // Check if we have valid eBay credentials
      const token = await getStoredEbayAccessToken("true");
      if (!token) {
        throw new Error("No eBay access token found");
      }

      // Determine sync strategy and fetch orders
      // Note: All sync strategies now include both new and existing orders to ensure updates happen
      const syncResult = await performSmartSync(token);

      // Update cron log with success
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      await EbayCronLog.findByIdAndUpdate(cronLog._id, {
        endTime,
        duration,
        status: "completed",
        itemsProcessed: syncResult.totalOrders,
        itemsCreated: syncResult.newOrders,
        itemsUpdated: syncResult.updatedOrders,
        itemsSkipped: syncResult.skippedOrders,
        itemsFailed: syncResult.failedOrders,
        metadata: {
          ...cronLog.metadata,
          syncStrategy: syncResult.syncStrategy,
          pagesProcessed: syncResult.pagesProcessed,
          totalEbayOrders: syncResult.totalEbayOrders,
          totalDbOrders: syncResult.totalDbOrders,
          lastSyncTime: endTime.toISOString(),
        },
      });

      console.log(
        `✅ eBay order sync completed successfully. Strategy: ${syncResult.syncStrategy}, Processed: ${syncResult.totalOrders}, New: ${syncResult.newOrders}, Updated: ${syncResult.updatedOrders}, Skipped: ${syncResult.skippedOrders}, Failed: ${syncResult.failedOrders}`
      );
    } catch (error: any) {
      console.error("❌ Error in eBay order sync cron job:", error);

      // Update cron log with failure
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      try {
        await EbayCronLog.findOneAndUpdate(
          { jobId },
          {
            endTime,
            duration,
            status: "failed",
            errorMessage: error.message || "Unknown error occurred",
            itemsFailed: 1,
            metadata: {
              error: error.message,
              stack: error.stack,
              lastErrorTime: endTime.toISOString(),
            },
          }
        );
      } catch (logError) {
        console.error("Failed to update cron log:", logError);
      }
    }
  });

  console.log("📅 eBay order sync cron job scheduled (every 10 minutes)");
};

/**
 * Intelligent sync strategy that adapts based on database state
 */
async function performSmartSync(token: any) {
  // Get sync metadata
  const syncMetadata = await getSyncMetadata();

  console.log(`📊 Sync Analysis:
    - eBay Total Orders: ${syncMetadata.totalEbayOrders}
    - DB Total Orders: ${syncMetadata.totalDbOrders}
    - Last Successful Sync: ${syncMetadata.lastSyncTime?.toISOString() || "Never"}
    - Is First Run: ${syncMetadata.isFirstRun}
    - Missing Orders: ${syncMetadata.missingOrdersCount}`);

  let syncStrategy: string;
  let orders: any[] = [];

  // Decide sync strategy based on analysis
  if (syncMetadata.isFirstRun || syncMetadata.missingOrdersCount > 1000) {
    // Full historical sync for first run or large gaps
    syncStrategy = "FULL_HISTORICAL_SYNC";
    orders = await performFullHistoricalSync(token, syncMetadata);
  } else if (syncMetadata.missingOrdersCount > 100) {
    // Partial backfill for medium gaps
    syncStrategy = "PARTIAL_BACKFILL_SYNC";
    orders = await performPartialBackfillSync(token, syncMetadata);
  } else {
    // Incremental sync for normal operation
    syncStrategy = "INCREMENTAL_SYNC";
    orders = await performIncrementalSync(token, syncMetadata);
  }

  // Process and store orders
  const result = await processAndStoreOrders(orders);

  return {
    ...result,
    syncStrategy,
    pagesProcessed: Math.ceil(orders.length / 100),
    totalEbayOrders: syncMetadata.totalEbayOrders,
    totalDbOrders: syncMetadata.totalDbOrders,
  };
}

/**
 * Analyze current sync state to determine strategy
 */
async function getSyncMetadata() {
  // Get eBay total count
  const token = await getStoredEbayAccessToken("true");
  const countResponse = await fetch("https://api.ebay.com/sell/fulfillment/v1/order?limit=1", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!countResponse.ok) {
    throw new Error(`eBay API error: ${countResponse.status} ${countResponse.statusText}`);
  }

  const countData = await countResponse.json();
  const totalEbayOrders = countData.total || 0;

  // Get database stats
  const totalDbOrders = await EbayOrder.countDocuments();

  // Get last successful sync
  const lastSuccessfulSync = await EbayCronLog.findOne(
    {
      jobType: "order_sync",
      status: "completed",
    },
    {},
    { sort: { endTime: -1 } }
  );

  // Get oldest and newest order dates from database
  const [oldestDbOrder, newestDbOrder] = await Promise.all([
    EbayOrder.findOne({}, {}, { sort: { creationDate: 1 } }),
    EbayOrder.findOne({}, {}, { sort: { creationDate: -1 } }),
  ]);

  const missingOrdersCount = Math.max(0, totalEbayOrders - totalDbOrders);
  const isFirstRun = totalDbOrders === 0;

  return {
    totalEbayOrders,
    totalDbOrders,
    missingOrdersCount,
    isFirstRun,
    lastSyncTime: lastSuccessfulSync?.endTime,
    oldestDbOrderDate: oldestDbOrder?.creationDate,
    newestDbOrderDate: newestDbOrder?.creationDate,
  };
}

/**
 * Full historical sync - fetches all orders from eBay (for first run or major gaps)
 */
async function performFullHistoricalSync(token: any, metadata: any): Promise<any[]> {
  console.log("🔄 Performing FULL HISTORICAL SYNC...");

  const limit = 100;
  let allOrders: any[] = [];
  let offset = 0;
  let hasMoreOrders = true;
  let pageCount = 0;

  while (hasMoreOrders) {
    console.log(`📄 Fetching historical page ${pageCount + 1} (offset: ${offset})`);

    const orders = await fetchEbayOrdersPage(token, limit, offset);

    if (orders.length === 0) {
      hasMoreOrders = false;
    } else {
      allOrders.push(...orders);
      offset += limit;
      pageCount++;

      // Add delay to avoid rate limits
      if (hasMoreOrders) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Safety check to prevent infinite loops
    if (pageCount > Math.ceil(metadata.totalEbayOrders / limit) + 10) {
      console.log("⚠️  Safety limit reached, stopping full sync");
      break;
    }
  }

  console.log(`✅ Full historical sync completed. Fetched ${allOrders.length} orders across ${pageCount} pages`);
  return allOrders;
}

/**
 * Partial backfill sync - fetches recent orders and fills gaps
 */
async function performPartialBackfillSync(token: any, metadata: any): Promise<any[]> {
  console.log("🔄 Performing PARTIAL BACKFILL SYNC...");

  const limit = 100;
  let allOrders: any[] = [];
  let offset = 0;
  let consecutiveExistingPages = 0;
  const maxConsecutiveExisting = 3; // Stop after 3 consecutive pages with all existing orders

  // Calculate approximate pages to check (with some buffer)
  const estimatedPagesToCheck = Math.min(
    Math.ceil(metadata.missingOrdersCount / limit) + 5,
    20 // Max 20 pages for partial backfill
  );

  for (let page = 0; page < estimatedPagesToCheck; page++) {
    console.log(`📄 Fetching backfill page ${page + 1} (offset: ${offset})`);

    const orders = await fetchEbayOrdersPage(token, limit, offset);

    if (orders.length === 0) {
      console.log("📄 No more orders available");
      break;
    }

    // Check how many orders already exist in our database
    const existingOrderIds = await EbayOrder.find({ orderId: { $in: orders.map((o) => o.orderId) } }, { orderId: 1 });

    const existingIds = new Set(existingOrderIds.map((o) => o.orderId));
    const newOrders = orders.filter((order) => !existingIds.has(order.orderId));

    console.log(`📊 Page ${page + 1}: ${newOrders.length} new, ${orders.length - newOrders.length} existing`);

    // Include ALL orders (both new and existing) to ensure updates happen
    allOrders.push(...orders);

    if (newOrders.length > 0) {
      consecutiveExistingPages = 0; // Reset counter
    } else {
      consecutiveExistingPages++;
    }

    // If we've seen too many consecutive pages with no new orders, we're likely done
    if (consecutiveExistingPages >= maxConsecutiveExisting) {
      console.log(`⏹️  Stopping backfill after ${maxConsecutiveExisting} consecutive pages with no new orders`);
      break;
    }

    offset += limit;

    // Add delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.log(`✅ Partial backfill sync completed. Fetched ${allOrders.length} orders (including updates)`);
  return allOrders;
}

/**
 * Incremental sync - fetches only recent orders since last sync
 */
async function performIncrementalSync(token: any, metadata: any): Promise<any[]> {
  console.log("🔄 Performing INCREMENTAL SYNC...");

  const limit = 100;
  let allOrders: any[] = [];
  let offset = 0;
  let hasMoreNewOrders = true;
  const maxPagesToCheck = 5; // Limit incremental sync to first 5 pages

  const lastSyncTime = metadata.lastSyncTime || new Date(0);

  for (let page = 0; page < maxPagesToCheck && hasMoreNewOrders; page++) {
    console.log(`📄 Fetching incremental page ${page + 1} (offset: ${offset})`);

    const orders = await fetchEbayOrdersPage(token, limit, offset);

    if (orders.length === 0) {
      break;
    }

    // Filter orders to only include new ones since last sync
    const newOrders = orders.filter((order: any) => {
      const orderDate = new Date(order.creationDate || order.lastModifiedDate);
      return orderDate > lastSyncTime;
    });

    if (newOrders.length > 0) {
      console.log(`📦 Found ${newOrders.length} new orders on page ${page + 1}`);
    }

    // Include ALL orders (both new and existing) to ensure updates happen
    // This ensures that even if an order wasn't created after last sync,
    // any changes to existing orders (status updates, fulfillment changes, etc.) are captured
    allOrders.push(...orders);

    // If this page had no new orders, we're likely done with recent changes
    if (newOrders.length === 0) {
      console.log(`⏭️  Page ${page + 1} has no new orders, stopping incremental sync`);
      hasMoreNewOrders = false;
    }

    offset += limit;

    // Add delay to avoid rate limits
    if (hasMoreNewOrders) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`✅ Incremental sync completed. Fetched ${allOrders.length} orders (including updates)`);
  return allOrders;
}

/**
 * Fetch a single page of orders from eBay API
 */
async function fetchEbayOrdersPage(token: any, limit: number, offset: number): Promise<any[]> {
  const ebayUrl = `https://api.ebay.com/sell/fulfillment/v1/order?limit=${limit}&offset=${offset}`;

  const response = await fetch(ebayUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`eBay API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.orders || [];
}

/**
 * Process and store orders in the database
 */
async function processAndStoreOrders(ebayOrders: any[]) {
  let newOrders = 0;
  let updatedOrders = 0;
  let skippedOrders = 0;
  let failedOrders = 0;
  const totalOrders = ebayOrders.length;
  let orderLeadsCreated = 0;

  console.log(`🔄 Processing ${totalOrders} orders (will create new ones and update existing ones)...`);

  // Process orders in batches for better performance
  const batchSize = 50;
  for (let i = 0; i < ebayOrders.length; i += batchSize) {
    const batch = ebayOrders.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async (ebayOrder) => {
        try {
          // Check if order already exists by orderId
          const existingOrder = await EbayOrder.findOne({
            orderId: ebayOrder.orderId,
          });

          if (existingOrder) {
            // Update existing order to reflect any changes from eBay
            await updateExistingOrder(String(existingOrder._id), ebayOrder);
            updatedOrders++;
            console.log(`🔄 Updated existing order: ${ebayOrder.orderId}`);
          } else {
            // Create new order
            await createNewOrder(ebayOrder);
            newOrders++;
            orderLeadsCreated++;
            console.log(`✅ Created new order: ${ebayOrder.orderId}`);
          }
        } catch (error) {
          console.error(`Error processing order ${ebayOrder.orderId}:`, error);
          failedOrders++;
        }
      })
    );

    // Log progress for large batches
    if (totalOrders > 100) {
      const processed = Math.min(i + batchSize, totalOrders);
      console.log(
        `📊 Progress: ${processed}/${totalOrders} orders processed (${newOrders} new, ${updatedOrders} updated)`
      );
    }
  }

  console.log(
    `📊 Final processing results: ${newOrders} new orders, ${updatedOrders} updated orders, ${failedOrders} failed`
  );

  return {
    totalOrders,
    newOrders,
    updatedOrders,
    skippedOrders,
    failedOrders,
    orderLeadsCreated,
  };
}

/**
 * Create a new eBay order
 */
async function createNewOrder(ebayOrder: any) {
  try {
    // Transform eBay order data to match our EbayOrder model
    const orderData = transformEbayOrderData(ebayOrder);

    // Create the eBay order
    const newEbayOrder = new EbayOrder(orderData);
    await newEbayOrder.save();

    console.log(`✅ Created new eBay order: ${newEbayOrder.orderId}`);

    // Automatically convert to order lead
    try {
      await convertEbayOrderToOrderLead(newEbayOrder);
      console.log(`✅ Automatically converted eBay order ${newEbayOrder.orderId} to order lead`);
    } catch (conversionError: any) {
      console.error(`⚠️  Failed to convert eBay order ${newEbayOrder.orderId} to order lead:`, conversionError.message);
      // Don't fail the main sync if conversion fails
    }
  } catch (error: any) {
    console.error(`Error creating eBay order ${ebayOrder.orderId}:`, error);
    throw error;
  }
}

/**
 * Update an existing eBay order with latest data
 */
async function updateExistingOrder(orderId: string, ebayOrder: any) {
  try {
    // Transform eBay order data to match our EbayOrder model
    const orderData = transformEbayOrderData(ebayOrder);

    // Update the order, excluding fields that shouldn't change
    const { orderId: _, ...updateData } = orderData;

    // Get the existing order to compare what changed
    const existingOrder = await EbayOrder.findById(orderId);

    await EbayOrder.findByIdAndUpdate(orderId, updateData, { new: true });

    // Log what was updated (optional - can be commented out for performance)
    if (existingOrder) {
      const changes = [];
      if (existingOrder.orderFulfillmentStatus !== orderData.orderFulfillmentStatus) {
        changes.push(
          `fulfillment status: ${existingOrder.orderFulfillmentStatus} → ${orderData.orderFulfillmentStatus}`
        );
      }
      if (existingOrder.orderPaymentStatus !== orderData.orderPaymentStatus) {
        changes.push(`payment status: ${existingOrder.orderPaymentStatus} → ${orderData.orderPaymentStatus}`);
      }
      if (existingOrder.lastModifiedDate?.toString() !== orderData.lastModifiedDate?.toString()) {
        changes.push(`last modified date updated`);
      }

      if (changes.length > 0) {
        console.log(`🔄 Updated existing eBay order: ${ebayOrder.orderId} - Changes: ${changes.join(", ")}`);
      } else {
        console.log(`🔄 Updated existing eBay order: ${ebayOrder.orderId} (no significant changes detected)`);
      }
    } else {
      console.log(`🔄 Updated existing eBay order: ${ebayOrder.orderId}`);
    }
  } catch (error) {
    console.error(`Error updating eBay order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Transform eBay order data to match our EbayOrder model structure
 */
function transformEbayOrderData(ebayOrder: any) {
  return {
    orderId: ebayOrder.orderId,
    legacyOrderId: ebayOrder.legacyOrderId || ebayOrder.orderId,
    creationDate: ebayOrder.creationDate,
    lastModifiedDate: ebayOrder.lastModifiedDate,
    orderFulfillmentStatus: ebayOrder.orderFulfillmentStatus || "PENDING",
    orderPaymentStatus: ebayOrder.orderPaymentStatus || "PENDING",
    sellerId: ebayOrder.sellerId || process.env.EBAY_SELLER_USERNAME,

    // Buyer information
    buyer: {
      username: ebayOrder.buyer?.username || "unknown",
      taxAddress: {
        stateOrProvince: ebayOrder.buyer?.taxAddress?.stateOrProvince || "",
        postalCode: ebayOrder.buyer?.taxAddress?.postalCode || "",
        countryCode: ebayOrder.buyer?.taxAddress?.countryCode || "",
      },
      buyerRegistrationAddress: {
        fullName: ebayOrder.buyer?.buyerRegistrationAddress?.fullName || "",
        contactAddress: {
          addressLine1: ebayOrder.buyer?.buyerRegistrationAddress?.contactAddress?.addressLine1 || "",
          addressLine2: ebayOrder.buyer?.buyerRegistrationAddress?.contactAddress?.addressLine2 || "",
          city: ebayOrder.buyer?.buyerRegistrationAddress?.contactAddress?.city || "",
          stateOrProvince: ebayOrder.buyer?.buyerRegistrationAddress?.contactAddress?.stateOrProvince || "",
          postalCode: ebayOrder.buyer?.buyerRegistrationAddress?.contactAddress?.postalCode || "",
          countryCode: ebayOrder.buyer?.buyerRegistrationAddress?.contactAddress?.countryCode || "",
        },
        primaryPhone: {
          phoneNumber: ebayOrder.buyer?.buyerRegistrationAddress?.primaryPhone?.phoneNumber || "",
        },
        secondaryPhone: ebayOrder.buyer?.buyerRegistrationAddress?.secondaryPhone
          ? {
              phoneNumber: ebayOrder.buyer.buyerRegistrationAddress.secondaryPhone.phoneNumber,
            }
          : undefined,
        email: ebayOrder.buyer?.buyerRegistrationAddress?.email || "",
      },
    },

    // Pricing summary
    pricingSummary: {
      priceSubtotal: {
        value: ebayOrder.pricingSummary?.priceSubtotal?.value || "0",
        currency: ebayOrder.pricingSummary?.priceSubtotal?.currency || "USD",
      },
      deliveryCost: {
        value: ebayOrder.pricingSummary?.deliveryCost?.value || "0",
        currency: ebayOrder.pricingSummary?.deliveryCost?.currency || "USD",
      },
      total: {
        value: ebayOrder.pricingSummary?.total?.value || "0",
        currency: ebayOrder.pricingSummary?.total?.currency || "USD",
      },
    },

    // Cancel status
    cancelStatus: {
      cancelState: ebayOrder.cancelStatus?.cancelState || "NOT_APPLICABLE",
      cancelRequests: ebayOrder.cancelStatus?.cancelRequests || [],
    },

    // Payment summary
    paymentSummary: {
      totalDueSeller: {
        value: ebayOrder.paymentSummary?.totalDueSeller?.value || "0",
        currency: ebayOrder.paymentSummary?.totalDueSeller?.currency || "USD",
      },
      refunds: ebayOrder.paymentSummary?.refunds || [],
      payments:
        ebayOrder.paymentSummary?.payments?.map((payment: any) => ({
          paymentMethod: payment.paymentMethod || "",
          paymentReferenceId: payment.paymentReferenceId || "",
          paymentDate: payment.paymentDate || "",
          amount: {
            value: payment.amount?.value || "0",
            currency: payment.amount?.currency || "USD",
          },
          paymentStatus: payment.paymentStatus || "",
        })) || [],
    },

    // Fulfillment instructions
    fulfillmentStartInstructions:
      ebayOrder.fulfillmentStartInstructions?.map((instruction: any) => ({
        fulfillmentInstructionsType: instruction.fulfillmentInstructionsType || "",
        minEstimatedDeliveryDate: instruction.minEstimatedDeliveryDate || "",
        maxEstimatedDeliveryDate: instruction.maxEstimatedDeliveryDate || "",
        ebaySupportedFulfillment: instruction.ebaySupportedFulfillment || false,
        shippingStep: {
          shipTo: {
            fullName: instruction.shippingStep?.shipTo?.fullName || "",
            contactAddress: {
              addressLine1: instruction.shippingStep?.shipTo?.contactAddress?.addressLine1 || "",
              addressLine2: instruction.shippingStep?.shipTo?.contactAddress?.addressLine2 || "",
              city: instruction.shippingStep?.shipTo?.contactAddress?.city || "",
              stateOrProvince: instruction.shippingStep?.shipTo?.contactAddress?.stateOrProvince || "",
              postalCode: instruction.shippingStep?.shipTo?.contactAddress?.postalCode || "",
              countryCode: instruction.shippingStep?.shipTo?.contactAddress?.countryCode || "",
            },
            primaryPhone: {
              phoneNumber: instruction.shippingStep?.shipTo?.primaryPhone?.phoneNumber || "",
            },
            email: instruction.shippingStep?.shipTo?.email || "",
          },
          shippingCarrierCode: instruction.shippingStep?.shippingCarrierCode || "",
          shippingServiceCode: instruction.shippingStep?.shippingServiceCode || "",
        },
      })) || [],

    // Fulfillment hrefs
    fulfillmentHrefs: ebayOrder.fulfillmentHrefs || [],

    // Line items
    lineItems:
      ebayOrder.lineItems?.map((lineItem: any) => ({
        lineItemId: lineItem.lineItemId || "",
        legacyItemId: lineItem.legacyItemId || lineItem.itemId || "",
        legacyVariationId: lineItem.legacyVariationId || "",
        variationAspects:
          lineItem.variationAspects?.map((aspect: any) => ({
            name: aspect.name || "",
            value: aspect.value || "",
          })) || [],
        title: lineItem.title || "",
        lineItemCost: {
          value: lineItem.lineItemCost?.value || lineItem.total?.value || "0",
          currency: lineItem.lineItemCost?.currency || lineItem.total?.currency || "USD",
        },
        quantity: lineItem.quantity || 1,
        soldFormat: lineItem.soldFormat || "AUCTION",
        listingMarketplaceId: lineItem.listingMarketplaceId || "EBAY_US",
        purchaseMarketplaceId: lineItem.purchaseMarketplaceId || "EBAY_US",
        lineItemFulfillmentStatus: lineItem.lineItemFulfillmentStatus || "PENDING",
        total: {
          value: lineItem.total?.value || "0",
          currency: lineItem.total?.currency || "USD",
        },
        deliveryCost: {
          shippingCost: {
            value: lineItem.deliveryCost?.shippingCost?.value || "0",
            currency: lineItem.deliveryCost?.shippingCost?.currency || "USD",
          },
        },
        appliedPromotions: lineItem.appliedPromotions || [],
        taxes: lineItem.taxes || [],
        properties: {
          buyerProtection: lineItem.properties?.buyerProtection || false,
          soldViaAdCampaign: lineItem.properties?.soldViaAdCampaign || false,
        },
        lineItemFulfillmentInstructions: {
          minEstimatedDeliveryDate: lineItem.lineItemFulfillmentInstructions?.minEstimatedDeliveryDate || "",
          maxEstimatedDeliveryDate: lineItem.lineItemFulfillmentInstructions?.maxEstimatedDeliveryDate || "",
          shipByDate: lineItem.lineItemFulfillmentInstructions?.shipByDate || "",
          guaranteedDelivery: lineItem.lineItemFulfillmentInstructions?.guaranteedDelivery || false,
        },
        itemLocation: {
          location: lineItem.itemLocation?.location || "",
          countryCode: lineItem.itemLocation?.countryCode || "",
          postalCode: lineItem.itemLocation?.postalCode || "",
        },
      })) || [],

    // Sales record reference
    salesRecordReference: ebayOrder.salesRecordReference || "",

    // Total fee basis amount
    totalFeeBasisAmount: {
      value: ebayOrder.totalFeeBasisAmount?.value || "0",
      currency: ebayOrder.totalFeeBasisAmount?.currency || "USD",
    },

    // Total marketplace fee
    totalMarketplaceFee: {
      value: ebayOrder.totalMarketplaceFee?.value || "0",
      currency: ebayOrder.totalMarketplaceFee?.currency || "USD",
    },

    // Buyer checkout notes
    buyerCheckoutNotes: ebayOrder.buyerCheckoutNotes || "",
  };
}

/**
 * Convert eBay order to order lead automatically
 */
async function convertEbayOrderToOrderLead(ebayOrder: any) {
  try {
    // Import Order model dynamically to avoid circular dependencies
    const { Order } = await import("@/models");

    // Check if this eBay order has already been converted
    const existingOrder = await Order.findOne({
      externalOrderId: ebayOrder.orderId,
    });

    if (existingOrder) {
      console.log(`ℹ️  eBay order ${ebayOrder.orderId} already converted to order lead`);
      return existingOrder;
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
        `eBay Order: ${ebayOrder.orderId}, Legacy ID: ${ebayOrder.legacyOrderId}, Seller: ${ebayOrder.sellerId}, Buyer: ${ebayOrder.buyer?.username}, Auto-converted: ${new Date().toISOString()}`,

      // Tracking information
      trackingNumber: "",
      trackingUrl: "",
      shippingStatus: "Pending",
    };

    // Create the order lead
    const newOrder = new Order(orderData);
    await newOrder.save();

    console.log(`✅ Created order lead from eBay order: ${ebayOrder.orderId} -> ${newOrder.orderId}`);
    return newOrder;
  } catch (error: any) {
    console.error(`Error converting eBay order ${ebayOrder.orderId} to order lead:`, error);
    throw error;
  }
}

/**
 * Helper functions for mapping eBay statuses to order statuses
 */
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
