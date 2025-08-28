import { Order } from "@/models/order.model";
import { OrderTask } from "@/models/order-task.model";
import { ProductTypeWorkflow } from "@/models/product-type-workflow.model";
import { IOrder, IOrderUpdatePayload, OrderStatus, SourcePlatform, PaymentStatus } from "@/contracts/order.contract";
import { Types } from "mongoose";

export const orderService = {
  // Create a new order
  createOrder: async (orderData: Partial<IOrder>) => {
    try {
      // 1) Create and persist the order
      const newOrder = new Order(orderData);
      await newOrder.save();

      // 2) Resolve relevant workflows ONCE for all item conditions for efficiency
      const appliesToOrderType = newOrder.type ?? ("SALE" as any);
      const itemConditions = Array.from(
        new Set((newOrder.items || []).map((it: any) => (it?.condition as unknown as string) || ""))
      ).filter(Boolean);

      const workflows = await ProductTypeWorkflow.find({
        isActive: true,
        $or: [{ appliesToOrderType: appliesToOrderType }, { appliesToOrderType: "ANY" }],
        $and: [
          {
            $or: [
              { appliesToCondition: "any" },
              ...(itemConditions.length > 0 ? itemConditions.map((c) => ({ appliesToCondition: c })) : []),
            ],
          },
        ],
      })
        .populate({ path: "steps.taskTypeId" })
        .lean();

      // 3) For each item, pick matching workflows and create tasks tied to that item
      const createdTaskIds: Types.ObjectId[] = [];
      for (const item of newOrder.items || []) {
        const itemCondition = (item?.condition as unknown as string) || undefined;

        const matchingForItem = workflows
          .filter((wf: any) => {
            return wf.appliesToOrderType === appliesToOrderType || wf.appliesToOrderType === "ANY";
            // Condition already filtered above; include all with 'any' or matching item condition
          })
          .filter((wf: any) => wf.appliesToCondition === "any" || wf.appliesToCondition === itemCondition);

        // For each physical unit (quantity), create a separate set of tasks
        const quantityCount = Math.max(Number(item?.quantity ?? 1), 1);
        for (let unitIndex = 1; unitIndex <= quantityCount; unitIndex++) {
          for (const wf of matchingForItem) {
            const steps = [...(wf.steps || [])];
            const stepIdToTaskId: Record<string, Types.ObjectId> = {};

            // First pass: create all tasks without dependencies
            for (const step of steps) {
              const taskType: any = step.taskTypeId;

              const baseEstimated = taskType?.defaultEstimatedTimeMinutes ?? 30;
              const basePriority = taskType?.defaultPriority ?? 2;
              const baseAssignedRole = taskType?.defaultAssignedRole ?? null;
              const baseName = taskType?.name ?? "Workflow Task";

              const estimatedTimeMinutes = step.overrideEstimatedTimeMinutes ?? baseEstimated;
              const priority = step.overridePriority ?? basePriority;
              const defaultAssignedRole = step.overrideDefaultAssignedRole ?? baseAssignedRole;
              const name = quantityCount > 1 ? `${baseName} (unit ${unitIndex}/${quantityCount})` : baseName;

              // Initially set all tasks as Ready, we'll update dependencies in the second pass
              const taskDoc = await OrderTask.create({
                orderId: newOrder._id,
                orderItemId: item?.itemId ?? null,
                taskTypeId: taskType?._id,
                name,
                priority,
                estimatedTimeMinutes,
                status: "Ready",
                isCustom: false,
                defaultAssignedRole: defaultAssignedRole,
                dependentOnTaskIds: [],
                pendingDependenciesCount: 0,
                externalRefId: item?.itemId ? `${item.itemId}:${unitIndex}` : undefined,
                logs: [
                  {
                    userName: "System",
                    action: "Task created from workflow",
                    details: `Workflow ${wf.name} step ${step.id} for item ${item?.itemId ?? "n/a"} unit ${unitIndex}/${quantityCount}`,
                    timestamp: new Date(),
                  },
                ],
              });

              stepIdToTaskId[step.id] = taskDoc._id as Types.ObjectId;
              createdTaskIds.push(taskDoc._id as Types.ObjectId);
            }

            // Second pass: update dependencies
            for (const step of steps) {
              if (Array.isArray(step.dependsOnSteps) && step.dependsOnSteps.length > 0) {
                const dependentOnTaskIds: Types.ObjectId[] = [];

                for (const dependencyStepId of step.dependsOnSteps) {
                  const dependencyTaskId = stepIdToTaskId[dependencyStepId];
                  if (dependencyTaskId) {
                    dependentOnTaskIds.push(dependencyTaskId);
                  }
                }

                if (dependentOnTaskIds.length > 0) {
                  const currentTaskId = stepIdToTaskId[step.id];
                  if (currentTaskId) {
                    await OrderTask.findByIdAndUpdate(currentTaskId, {
                      status: "Pending",
                      dependentOnTaskIds,
                      pendingDependenciesCount: dependentOnTaskIds.length,
                    });
                  }
                }
              }
            }
          }
        }
      }

      if (createdTaskIds.length > 0) {
        await Order.findByIdAndUpdate(
          newOrder._id,
          { $addToSet: { taskIds: { $each: createdTaskIds } } },
          { new: true }
        );
      }

      const populatedOrder = await Order.findById(newOrder._id)
        .populate("taskIds", "name status priority estimatedTimeMinutes orderItemId")
        .lean();

      return populatedOrder ?? newOrder;
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error("Failed to create order");
    }
  },

  // Get all orders with optional filtering and pagination
  getAllOrders: async (
    filters: {
      status?: OrderStatus;
      sourcePlatform?: SourcePlatform;
      paymentStatus?: PaymentStatus;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      isLead?: boolean;
    } = {}
  ) => {
    try {
      const {
        status,
        sourcePlatform,
        paymentStatus,
        customerId,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        isLead = false,
      } = filters;

      // Build query
      const query: any = {};

      if (status) query.status = status;
      if (sourcePlatform) query.sourcePlatform = sourcePlatform;
      if (paymentStatus) query.paymentStatus = paymentStatus;
      if (customerId) query.customerId = new Types.ObjectId(customerId);
      if (isLead) {
        // Check if any item in the products array is missing stockId, listingId, or inventoryId
        // If any item is missing these IDs, it's considered a lead order
        query.$or = [
          // Check items array (new schema)
          {
            items: {
              $elemMatch: {
                $or: [
                  { stockId: { $exists: false } },
                  { stockId: null },
                  { listingId: { $exists: false } },
                  { listingId: null },
                  { inventoryId: { $exists: false } },
                  { inventoryId: null },
                ],
              },
            },
          },
          // Check products array (legacy schema) - these are always lead orders since they only have product reference
          {
            products: { $exists: true, $ne: [] },
          },
        ];
      } else {
        query.$and = [
          // Check items array (new schema) - all items must have all required IDs
          {
            items: {
              $not: {
                $elemMatch: {
                  $or: [
                    { stockId: { $exists: false } },
                    { stockId: null },
                    { listingId: { $exists: false } },
                    { listingId: null },
                    { inventoryId: { $exists: false } },
                    { inventoryId: null },
                  ],
                },
              },
            },
          },
          // Check products array (legacy schema) - these are always lead orders since they only have product reference
          {
            products: { $exists: true, $ne: [] },
          },
        ];
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      const orders = await Order.find(query)
        .populate("customer", "firstName lastName email")
        .populate("customerId", "firstName lastName email")
        .populate("items.listingId", "name sku")
        .populate("items.inventoryId", "name sku")
        .populate("items.stockId", "name sku")
        .populate("taskIds", "name status")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const total = await Order.countDocuments(query);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw new Error("Failed to retrieve orders");
    }
  },

  // Get order by ID with full population
  getOrderById: async (orderId: string) => {
    try {
      const order = await Order.findById(orderId).populate([
        {
          path: "customer",
          select: "firstName lastName email",
        },
        {
          path: "customerId",
        },
        {
          path: "items.listingId",
          select: "name sku",
        },
        {
          path: "taskIds",
          select: "name status",
        },
        {
          path: "originalOrderId",
          select: "orderId",
        },
        {
          path: "replacementDetails.replacementOrderId",
          select: "orderId",
        },
        {
          path: "createdBy",
          select: "firstName lastName email",
        },
        {
          path: "updatedBy",
          select: "firstName lastName email",
        },
      ]);
      // .populate("customer")
      // .populate("customerId")
      // .populate("items.productId")
      // .populate("taskIds")
      // .populate("originalOrderId")
      // .populate("replacementDetails.replacementOrderId")
      // .populate("createdBy")
      // .populate("updatedBy");

      if (!order) {
        throw new Error("Order not found");
      }
      return order;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw new Error("Failed to retrieve order");
    }
  },

  // Get order by order ID (custom orderId field)
  getOrderByOrderId: async (orderId: string) => {
    try {
      const order = await Order.findOne({ orderId })
        .populate("customer")
        .populate("customerId")
        .populate("items.productId")
        .populate("products.product")
        .populate("taskIds")
        .populate("originalOrderId")
        .populate("replacementDetails.replacementOrderId")
        .populate("createdBy")
        .populate("updatedBy");

      if (!order) {
        throw new Error("Order not found");
      }
      return order;
    } catch (error) {
      console.error("Error fetching order by orderId:", error);
      throw new Error("Failed to retrieve order");
    }
  },

  // Update order by ID
  updateOrderById: async (orderId: string, data: IOrderUpdatePayload) => {
    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate("customer", "firstName lastName email")
        .populate("customerId", "firstName lastName email")
        .populate("items.productId", "name sku")
        .populate("products.product", "name sku");

      if (!updatedOrder) {
        throw new Error("Order not found");
      }
      return updatedOrder;
    } catch (error) {
      console.error("Error updating order:", error);
      throw new Error("Failed to update order");
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: OrderStatus, updatedBy?: string) => {
    try {
      const updateData: any = { status, updatedAt: new Date() };

      // Add timestamp based on status
      switch (status) {
        case "SHIPPED":
          updateData.shippedAt = new Date();
          break;
        case "DELIVERED":
          updateData.deliveredAt = new Date();
          break;
        case "COMPLETED":
          updateData.completedAt = new Date();
          break;
      }

      if (updatedBy) {
        updateData.updatedBy = new Types.ObjectId(updatedBy);
      }

      const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
        new: true,
        runValidators: true,
      }).populate("customer", "firstName lastName email");

      if (!updatedOrder) {
        throw new Error("Order not found");
      }
      return updatedOrder;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw new Error("Failed to update order status");
    }
  },

  // Delete order by ID
  deleteOrderById: async (orderId: string) => {
    try {
      const deletedOrder = await Order.findByIdAndDelete(orderId);
      if (!deletedOrder) {
        throw new Error("Order not found");
      }
      return deletedOrder;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw new Error("Failed to delete order");
    }
  },

  // Get orders by customer ID
  getOrdersByCustomerId: async (customerId: string, page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit;

      const orders = await Order.find({ customerId: new Types.ObjectId(customerId) })
        .populate("items.productId", "name sku")
        .populate("products.product", "name sku")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Order.countDocuments({ customerId: new Types.ObjectId(customerId) });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      throw new Error("Failed to retrieve customer orders");
    }
  },

  // Get orders by status
  getOrdersByStatus: async (status: OrderStatus, page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit;

      const orders = await Order.find({ status })
        .populate("customer", "firstName lastName email")
        .populate("customerId", "firstName lastName email")
        .populate("items.productId", "name sku")
        .populate("products.product", "name sku")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Order.countDocuments({ status });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching orders by status:", error);
      throw new Error("Failed to retrieve orders by status");
    }
  },

  // Get orders by platform
  getOrdersByPlatform: async (sourcePlatform: SourcePlatform, page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit;

      const orders = await Order.find({ sourcePlatform })
        .populate("customer", "firstName lastName email")
        .populate("customerId", "firstName lastName email")
        .populate("items.productId", "name sku")
        .populate("products.product", "name sku")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Order.countDocuments({ sourcePlatform });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching orders by platform:", error);
      throw new Error("Failed to retrieve orders by platform");
    }
  },

  // Search orders
  searchOrders: async (searchTerm: string, page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit;

      const searchQuery = {
        $or: [
          { orderId: { $regex: searchTerm, $options: "i" } },
          { orderNumber: { $regex: searchTerm, $options: "i" } },
          { "customerDetails.firstName": { $regex: searchTerm, $options: "i" } },
          { "customerDetails.lastName": { $regex: searchTerm, $options: "i" } },
          { "customerDetails.email": { $regex: searchTerm, $options: "i" } },
          { trackingNumber: { $regex: searchTerm, $options: "i" } },
          { externalOrderId: { $regex: searchTerm, $options: "i" } },
        ],
      };

      const orders = await Order.find(searchQuery)
        .populate("customer", "firstName lastName email")
        .populate("customerId", "firstName lastName email")
        .populate("items.productId", "name sku")
        .populate("products.product", "name sku")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Order.countDocuments(searchQuery);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error searching orders:", error);
      throw new Error("Failed to search orders");
    }
  },

  // Get order statistics
  getOrderStatistics: async (
    filters: {
      startDate?: Date;
      endDate?: Date;
      sourcePlatform?: SourcePlatform;
    } = {}
  ) => {
    try {
      const { startDate, endDate, sourcePlatform } = filters;

      const query: any = {};
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }
      if (sourcePlatform) query.sourcePlatform = sourcePlatform;

      const [totalOrders, pendingOrders, completedOrders, cancelledOrders, totalRevenue, averageOrderValue] =
        await Promise.all([
          Order.countDocuments(query),
          Order.countDocuments({ ...query, status: { $in: ["PENDING_PAYMENT", "PENDING_ADMIN_CONFIGURATION"] } }),
          Order.countDocuments({ ...query, status: { $in: ["COMPLETED", "DELIVERED"] } }),
          Order.countDocuments({ ...query, status: "CANCELLED" }),
          Order.aggregate([
            { $match: { ...query, status: { $in: ["COMPLETED", "DELIVERED"] } } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } },
          ]),
          Order.aggregate([
            { $match: { ...query, status: { $in: ["COMPLETED", "DELIVERED"] } } },
            { $group: { _id: null, average: { $avg: "$grandTotal" } } },
          ]),
        ]);

      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        averageOrderValue: averageOrderValue[0]?.average || 0,
      };
    } catch (error) {
      console.error("Error fetching order statistics:", error);
      throw new Error("Failed to retrieve order statistics");
    }
  },

  // Create refund order
  createRefundOrder: async (
    originalOrderId: string,
    refundData: {
      reason: string;
      refundAmount: number;
      itemsToRefund?: string[];
      createdBy?: string;
    }
  ) => {
    try {
      const originalOrder = await Order.findById(originalOrderId);
      if (!originalOrder) {
        throw new Error("Original order not found");
      }

      const refundOrder = new Order({
        type: "REFUND",
        originalOrderId: originalOrder._id,
        reason: refundData.reason,
        sourcePlatform: originalOrder.sourcePlatform,
        customerId: originalOrder.customerId,
        customerDetails: originalOrder.customerDetails,
        email: originalOrder.email,
        shippingAddress: originalOrder.shippingAddress,
        billingAddress: originalOrder.billingAddress,
        currency: originalOrder.currency,
        refundDetails: {
          refundAmount: refundData.refundAmount,
          refundStatus: "PENDING",
        },
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        createdBy: refundData.createdBy ? new Types.ObjectId(refundData.createdBy) : undefined,
      });

      await refundOrder.save();
      return refundOrder;
    } catch (error) {
      console.error("Error creating refund order:", error);
      throw new Error("Failed to create refund order");
    }
  },

  // Create replacement order
  createReplacementOrder: async (
    originalOrderId: string,
    replacementData: {
      reason: string;
      items: any[];
      createdBy?: string;
    }
  ) => {
    try {
      const originalOrder = await Order.findById(originalOrderId);
      if (!originalOrder) {
        throw new Error("Original order not found");
      }

      const replacementOrder = new Order({
        type: "REPLACEMENT",
        originalOrderId: originalOrder._id,
        reason: replacementData.reason,
        sourcePlatform: originalOrder.sourcePlatform,
        customerId: originalOrder.customerId,
        customerDetails: originalOrder.customerDetails,
        email: originalOrder.email,
        shippingAddress: originalOrder.shippingAddress,
        billingAddress: originalOrder.billingAddress,
        items: replacementData.items,
        currency: originalOrder.currency,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        createdBy: replacementData.createdBy ? new Types.ObjectId(replacementData.createdBy) : undefined,
      });

      await replacementOrder.save();
      return replacementOrder;
    } catch (error) {
      console.error("Error creating replacement order:", error);
      throw new Error("Failed to create replacement order");
    }
  },

  // Convert eBay order to normal order
  convertEbayOrderToOrder: async (ebayOrderId: string) => {
    try {
      // Import EbayOrder model dynamically to avoid circular dependencies
      const { EbayOrder } = await import("@/models");

      // Find the eBay order in the database
      const ebayOrder = await EbayOrder.findOne({
        $or: [{ orderId: ebayOrderId }, { legacyOrderId: ebayOrderId }],
      });

      if (!ebayOrder) {
        throw new Error("eBay order not found");
      }

      // Check if this eBay order has already been converted
      const existingOrder = await Order.findOne({
        externalOrderId: ebayOrder.orderId,
      });

      if (existingOrder) {
        throw new Error("This eBay order has already been converted to a normal order");
      }

      // Map eBay order data to normal order structure
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
          street1:
            ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.addressLine1 || "",
          street2:
            ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.addressLine2 || "",
          city: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.city || "",
          stateProvince:
            ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.stateOrProvince || "",
          postalCode:
            ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.postalCode || "",
          country: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.countryCode || "",
        },

        // Items
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
          })) || [],

        // Special instructions - include eBay-specific information
        specialInstructions:
          ebayOrder.buyerCheckoutNotes ||
          `eBay Order: ${ebayOrder.orderId}, Legacy ID: ${ebayOrder.legacyOrderId}, Seller: ${ebayOrder.sellerId}, Buyer: ${ebayOrder.buyer?.username}, Converted: ${new Date().toISOString()}`,

        // Tracking information
        trackingNumber: "",
        trackingUrl: "",
        shippingStatus: "Pending",
      };

      // Create the normal order
      const newOrder = new Order(orderData);
      await newOrder.save();

      // // Create tasks for the converted order based on workflows
      // try {
      //   // 1) Resolve relevant workflows for all item conditions
      //   const appliesToOrderType = newOrder.type ?? ("SALE" as any);
      //   const itemConditions = Array.from(
      //     new Set((newOrder.items || []).map((it: any) => (it?.condition as unknown as string) || ""))
      //   ).filter(Boolean);

      //   const workflows = await ProductTypeWorkflow.find({
      //     isActive: true,
      //     $or: [{ appliesToOrderType: appliesToOrderType }, { appliesToOrderType: "ANY" }],
      //     $and: [
      //       {
      //         $or: [
      //           { appliesToCondition: "any" },
      //           ...(itemConditions.length > 0 ? itemConditions.map((c) => ({ appliesToCondition: c })) : []),
      //         ],
      //       },
      //     ],
      //   })
      //     .populate({ path: "steps.taskTypeId" })
      //     .lean();

      //   // 2) For each item, create tasks based on matching workflows
      //   const createdTaskIds: Types.ObjectId[] = [];
      //   for (const item of newOrder.items || []) {
      //     const itemCondition = (item?.condition as unknown as string) || undefined;

      //     const matchingForItem = workflows
      //       .filter((wf: any) => {
      //         return wf.appliesToOrderType === appliesToOrderType || wf.appliesToOrderType === "ANY";
      //       })
      //       .filter((wf: any) => wf.appliesToCondition === "any" || wf.appliesToCondition === itemCondition);

      //     // For each physical unit (quantity), create a separate set of tasks
      //     const quantityCount = Math.max(Number(item?.quantity ?? 1), 1);
      //     for (let unitIndex = 1; unitIndex <= quantityCount; unitIndex++) {
      //       for (const wf of matchingForItem) {
      //         const steps = [...(wf.steps || [])].sort((a: any, b: any) => a.stepOrder - b.stepOrder);
      //         const stepIndexToTaskId: Record<number, Types.ObjectId> = {};

      //         for (const step of steps) {
      //           const taskType: any = step.taskTypeId;

      //           const baseEstimated = taskType?.defaultEstimatedTimeMinutes ?? 30;
      //           const basePriority = taskType?.defaultPriority ?? 2;
      //           const baseAssignedRole = taskType?.defaultAssignedRole ?? null;
      //           const baseName = taskType?.name ?? "Workflow Task";

      //           const estimatedTimeMinutes = step.overrideEstimatedTimeMinutes ?? baseEstimated;
      //           const priority = step.overridePriority ?? basePriority;
      //           const defaultAssignedRole = step.overrideDefaultAssignedRole ?? baseAssignedRole;
      //           const name = quantityCount > 1 ? `${baseName} (unit ${unitIndex}/${quantityCount})` : baseName;

      //           const dependentOnTaskIds: Types.ObjectId[] = [];
      //           if (Array.isArray(step.dependsOnSteps) && step.dependsOnSteps.length > 0) {
      //             for (const dep of step.dependsOnSteps) {
      //               const depIndex = parseInt(dep, 10);
      //               const depTaskId = stepIndexToTaskId[depIndex];
      //               if (depTaskId) dependentOnTaskIds.push(depTaskId);
      //             }
      //           }

      //           const taskDoc = await OrderTask.create({
      //             orderId: newOrder._id,
      //             orderItemId: item?.itemId ?? null,
      //             taskTypeId: taskType?._id,
      //             name,
      //             priority,
      //             estimatedTimeMinutes,
      //             status: dependentOnTaskIds.length > 0 ? "Pending" : "Ready",
      //             isCustom: false,
      //             defaultAssignedRole: defaultAssignedRole,
      //             dependentOnTaskIds,
      //             pendingDependenciesCount: dependentOnTaskIds.length,
      //             externalRefId: item?.itemId ? `${item.itemId}:${unitIndex}` : undefined,
      //             logs: [
      //               {
      //                 userName: "System",
      //                 action: "Task created from workflow for converted eBay order",
      //                 details: `Workflow ${wf.name} step ${step.stepOrder} for item ${item?.itemId ?? "n/a"} unit ${unitIndex}/${quantityCount} - Converted from eBay order ${ebayOrder.orderId}`,
      //                 timestamp: new Date(),
      //               },
      //             ],
      //           });

      //           stepIndexToTaskId[step.stepOrder] = taskDoc._id as Types.ObjectId;
      //           createdTaskIds.push(taskDoc._id as Types.ObjectId);
      //         }
      //       }
      //     }
      //   }

      //   // 3) Update the order with the created task IDs
      //   if (createdTaskIds.length > 0) {
      //     await Order.findByIdAndUpdate(
      //       newOrder._id,
      //       { $addToSet: { taskIds: { $each: createdTaskIds } } },
      //       { new: true }
      //     );
      //   }
      // } catch (taskError) {
      //   console.error("Error creating tasks for converted eBay order:", taskError);
      //   // Don't fail the conversion if task creation fails, just log it
      // }

      return newOrder;
    } catch (error: any) {
      throw new Error(error.message || "Error converting eBay order to normal order");
    }
  },

  // Get all eBay orders with optional filtering and pagination
  getAllEbayOrders: async (
    filters: {
      orderFulfillmentStatus?: string;
      orderPaymentStatus?: string;
      sellerId?: string;
      buyerUsername?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ) => {
    try {
      const {
        orderFulfillmentStatus,
        orderPaymentStatus,
        sellerId,
        buyerUsername,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = "creationDate",
        sortOrder = "desc",
      } = filters;

      // Build query
      const query: any = {};

      if (orderFulfillmentStatus) query.orderFulfillmentStatus = orderFulfillmentStatus;
      if (orderPaymentStatus) query.orderPaymentStatus = orderPaymentStatus;
      if (sellerId) query.sellerId = sellerId;
      if (buyerUsername) query["buyer.username"] = { $regex: buyerUsername, $options: "i" };

      // Date range filtering
      if (startDate || endDate) {
        query.creationDate = {};
        if (startDate) query.creationDate.$gte = startDate.toISOString();
        if (endDate) query.creationDate.$lte = endDate.toISOString();
      }

      // Import Order model to check for converted orders
      const { Order } = await import("@/models/order.model");

      // Get all converted eBay order IDs
      const convertedOrders = await Order.find({
        sourcePlatform: "EBAY",
        externalOrderId: { $exists: true, $ne: null },
      })
        .select("externalOrderId")
        .lean();

      const convertedOrderIds = convertedOrders.map((order) => order.externalOrderId);

      // Exclude converted orders from the query
      if (convertedOrderIds.length > 0) {
        query.orderId = { $nin: convertedOrderIds };
      }

      // Calculate skip for pagination
      const skip = (page - 1) * limit;

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Import EbayOrder model dynamically to avoid circular dependencies
      const { EbayOrder } = await import("@/models/ebay-order.model");

      // Execute query with pagination and sorting
      const [orders, total] = await Promise.all([
        EbayOrder.find(query).sort(sort).skip(skip).limit(limit).lean(),
        EbayOrder.countDocuments(query),
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null,
        },
      };
    } catch (error: any) {
      console.error("Error fetching eBay orders:", error);
      throw new Error(error.message || "Error fetching eBay orders");
    }
  },

  // Update order items with listing, inventory, stock, and quantity details
  updateOrderItems: async (orderId: string, items: any[], recalculateTotals: boolean = true) => {
    try {
      // Find the order
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Update each item in the order
      for (const updateItem of items) {
        const { itemId, ...updateData } = updateItem;

        // Find the item in the order by itemId
        const itemIndex = order.items.findIndex((item) => item.itemId === itemId);
        if (itemIndex === -1) {
          throw new Error("Item not found");
        }

        // Update the item with new data
        const originalItem = order.items[itemIndex];

        // Update fields that are provided in the request
        const updatedItem = {
          ...originalItem,
          ...updateData,
        };

        // Recalculate item totals if quantity or prices changed
        if (updateData.quantity || updateData.unitPrice || updateData.discountAmount || updateData.taxAmount) {
          const quantity = updateData.quantity ?? originalItem.quantity;
          const unitPrice = updateData.unitPrice ?? originalItem.unitPrice;
          const discountAmount = updateData.discountAmount ?? originalItem.discountAmount;
          const taxAmount = updateData.taxAmount ?? originalItem.taxAmount;

          updatedItem.itemTotal = quantity * unitPrice;
          updatedItem.finalPrice = updatedItem.itemTotal - discountAmount + taxAmount;
        }

        // Replace the item in the order
        order.items[itemIndex] = updatedItem as any;
      }

      // Recalculate order totals if requested
      if (recalculateTotals) {
        let subtotal = 0;
        let totalDiscount = 0;
        let taxAmount = 0;

        for (const item of order.items) {
          subtotal += item.itemTotal;
          totalDiscount += item.discountAmount;
          taxAmount += item.taxAmount;
        }

        order.subtotal = subtotal;
        order.totalDiscount = totalDiscount;
        order.taxAmount = taxAmount;
        order.grandTotal = subtotal - totalDiscount + taxAmount + order.shippingCost;
      }

      // Save the updated order
      await order.save();

      // Return the updated order with populated fields
      const updatedOrder = await Order.findById(orderId)
        .populate("customer", "firstName lastName email")
        .populate("customerId", "firstName lastName email")
        .populate("items.listingId", "title description")
        .populate("items.inventoryId", "sku name")
        .populate("items.stockId", "quantity location")
        .populate("products.product", "name sku");

      return updatedOrder;
    } catch (error: any) {
      console.error("Error updating order items:", error);
      throw new Error(error.message || "Failed to update order items");
    }
  },
};

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
