import { Schema, model, Types } from "mongoose";
import { IEbayOrder, EbayOrderModel } from "@/contracts/ebay-order.contract";

// Sub-schemas for nested objects
const EbayAddressSchema = new Schema(
  {
    stateOrProvince: { type: String },
    postalCode: { type: String },
    countryCode: { type: String },
  },
  { _id: false }
);

const EbayContactAddressSchema = new Schema(
  {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    stateOrProvince: { type: String },
    postalCode: { type: String },
    countryCode: { type: String },
  },
  { _id: false }
);

const EbayPhoneSchema = new Schema(
  {
    phoneNumber: { type: String },
  },
  { _id: false }
);

const EbayBuyerRegistrationAddressSchema = new Schema(
  {
    fullName: { type: String },
    contactAddress: { type: EbayContactAddressSchema, required: true },
    primaryPhone: { type: EbayPhoneSchema },
    secondaryPhone: { type: EbayPhoneSchema },
    email: { type: String },
  },
  { _id: false }
);

const EbayBuyerSchema = new Schema(
  {
    username: { type: String, required: true, index: true },
    taxAddress: { type: EbayAddressSchema },
    buyerRegistrationAddress: { type: EbayBuyerRegistrationAddressSchema },
  },
  { _id: false }
);

const EbayAmountSchema = new Schema(
  {
    value: { type: String, required: true },
    currency: { type: String, required: true },
  },
  { _id: false }
);

const EbayPricingSummarySchema = new Schema(
  {
    priceSubtotal: { type: EbayAmountSchema, required: true },
    deliveryCost: { type: EbayAmountSchema, required: true },
    total: { type: EbayAmountSchema, required: true },
  },
  { _id: false }
);

const EbayCancelStatusSchema = new Schema(
  {
    cancelState: { type: String, required: true },
    cancelRequests: [{ type: Schema.Types.Mixed }],
  },
  { _id: false }
);

const EbayPaymentSchema = new Schema(
  {
    paymentMethod: { type: String, required: true },
    paymentReferenceId: { type: String, required: true },
    paymentDate: { type: String, required: true },
    amount: { type: EbayAmountSchema, required: true },
    paymentStatus: { type: String, required: true },
  },
  { _id: false }
);

const EbayPaymentSummarySchema = new Schema(
  {
    totalDueSeller: { type: EbayAmountSchema },
    refunds: [{ type: Schema.Types.Mixed }],
    payments: [{ type: EbayPaymentSchema }],
  },
  { _id: false }
);

const EbayShipToSchema = new Schema(
  {
    fullName: { type: String },
    contactAddress: { type: EbayContactAddressSchema },
    primaryPhone: { type: EbayPhoneSchema },
    email: { type: String },
  },
  { _id: false }
);

const EbayShippingStepSchema = new Schema(
  {
    shipTo: { type: EbayShipToSchema, required: true },
    shippingCarrierCode: { type: String },
    shippingServiceCode: { type: String, required: true },
  },
  { _id: false }
);

const EbayFulfillmentInstructionSchema = new Schema(
  {
    fulfillmentInstructionsType: { type: String },
    minEstimatedDeliveryDate: { type: String },
    maxEstimatedDeliveryDate: { type: String },
    ebaySupportedFulfillment: { type: Boolean },
    shippingStep: { type: EbayShippingStepSchema },
  },
  { _id: false }
);

const EbayVariationAspectSchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const EbayDeliveryCostSchema = new Schema(
  {
    shippingCost: { type: EbayAmountSchema, required: true },
  },
  { _id: false }
);

const EbayLineItemPropertiesSchema = new Schema(
  {
    buyerProtection: { type: Boolean, required: true },
    soldViaAdCampaign: { type: Boolean },
  },
  { _id: false }
);

const EbayLineItemFulfillmentInstructionsSchema = new Schema(
  {
    minEstimatedDeliveryDate: { type: String },
    maxEstimatedDeliveryDate: { type: String },
    shipByDate: { type: String },
    guaranteedDelivery: { type: Boolean },
  },
  { _id: false }
);

const EbayItemLocationSchema = new Schema(
  {
    location: { type: String },
    countryCode: { type: String },
    postalCode: { type: String },
  },
  { _id: false }
);

const EbayLineItemSchema = new Schema(
  {
    lineItemId: { type: String, required: true },
    legacyItemId: { type: String },
    legacyVariationId: { type: String },
    variationAspects: [{ type: EbayVariationAspectSchema }],
    title: { type: String, required: true },
    lineItemCost: { type: EbayAmountSchema, required: true },
    quantity: { type: Number, required: true },
    soldFormat: { type: String, required: true },
    listingMarketplaceId: { type: String, required: true },
    purchaseMarketplaceId: { type: String, required: true },
    lineItemFulfillmentStatus: { type: String, required: true },
    total: { type: EbayAmountSchema, required: true },
    deliveryCost: { type: EbayDeliveryCostSchema, required: true },
    appliedPromotions: [{ type: Schema.Types.Mixed }],
    taxes: [{ type: Schema.Types.Mixed }],
    properties: { type: EbayLineItemPropertiesSchema },
    lineItemFulfillmentInstructions: { type: EbayLineItemFulfillmentInstructionsSchema },
    itemLocation: { type: EbayItemLocationSchema },
  },
  { _id: false }
);

// Main eBay Order Schema
const EbayOrderSchema = new Schema<IEbayOrder, EbayOrderModel>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    legacyOrderId: {
      type: String,
      required: true,
      index: true,
    },
    creationDate: {
      type: String,
      required: true,
    },
    lastModifiedDate: {
      type: String,
      required: true,
    },
    orderFulfillmentStatus: {
      type: String,
      required: true,
      index: true,
    },
    orderPaymentStatus: {
      type: String,
      required: true,
      index: true,
    },
    sellerId: {
      type: String,
      required: true,
      index: true,
    },
    buyer: {
      type: EbayBuyerSchema,
      required: true,
    },
    pricingSummary: {
      type: EbayPricingSummarySchema,
      required: true,
    },
    cancelStatus: {
      type: EbayCancelStatusSchema,
    },
    paymentSummary: {
      type: EbayPaymentSummarySchema,
      required: true,
    },
    fulfillmentStartInstructions: [
      {
        type: EbayFulfillmentInstructionSchema,
      },
    ],
    fulfillmentHrefs: [
      {
        type: String,
      },
    ],
    lineItems: [
      {
        type: EbayLineItemSchema,
      },
    ],
    salesRecordReference: {
      type: String,
    },
    totalFeeBasisAmount: {
      type: EbayAmountSchema,
      required: true,
    },
    totalMarketplaceFee: {
      type: EbayAmountSchema,
      required: true,
    },
    buyerCheckoutNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "ebay_orders",
  }
);

// Indexes for better query performance
EbayOrderSchema.index({ sellerId: 1, creationDate: -1 });
EbayOrderSchema.index({ orderFulfillmentStatus: 1, orderPaymentStatus: 1 });
EbayOrderSchema.index({ "buyer.username": 1 });
EbayOrderSchema.index({ "lineItems.legacyItemId": 1 });

// Create and export the model
export const EbayOrder = model<IEbayOrder, EbayOrderModel>("EbayOrder", EbayOrderSchema);
