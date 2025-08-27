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

  console.log("📅 eBay order sync cron job scheduled (every 30 minutes)");
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

    if (newOrders.length > 0) {
      allOrders.push(...newOrders);
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

  console.log(`✅ Partial backfill sync completed. Fetched ${allOrders.length} new orders`);
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
      allOrders.push(...newOrders);
      console.log(`📦 Found ${newOrders.length} new orders on page ${page + 1}`);
    }

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

  console.log(`✅ Incremental sync completed. Fetched ${allOrders.length} new orders`);
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

  console.log(`🔄 Processing ${totalOrders} orders...`);

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
            // Update existing order
            await updateExistingOrder(String(existingOrder._id), ebayOrder);
            updatedOrders++;
          } else {
            // Create new order
            await createNewOrder(ebayOrder);
            newOrders++;
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
      console.log(`📊 Progress: ${processed}/${totalOrders} orders processed`);
    }
  }

  return {
    totalOrders,
    newOrders,
    updatedOrders,
    skippedOrders,
    failedOrders,
  };
}

/**
 * Create a new eBay order
 */
async function createNewOrder(ebayOrder: any) {
  try {
    // Transform eBay order data to match our EbayOrder model
    const orderData = transformEbayOrderData(ebayOrder);

    // Create the order
    const newOrder = new EbayOrder(orderData);
    await newOrder.save();

    console.log(`✅ Created new eBay order: ${newOrder.orderId}`);
  } catch (error) {
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

    await EbayOrder.findByIdAndUpdate(orderId, updateData, { new: true });

    console.log(`🔄 Updated existing eBay order: ${ebayOrder.orderId}`);
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
