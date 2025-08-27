import { Model, Types } from "mongoose";

export interface IEbayOrder {
  _id: Types.ObjectId;
  orderId: string;
  legacyOrderId?: string;
  creationDate: string;
  lastModifiedDate: string;
  orderFulfillmentStatus: string;
  orderPaymentStatus: string;
  sellerId: string;
  buyer: IEbayBuyer;
  pricingSummary: IEbayPricingSummary;
  cancelStatus?: IEbayCancelStatus;
  paymentSummary: IEbayPaymentSummary;
  fulfillmentStartInstructions?: IEbayFulfillmentInstruction[];
  fulfillmentHrefs?: string[];
  lineItems: IEbayLineItem[];
  salesRecordReference: string;
  totalFeeBasisAmount: IEbayAmount;
  totalMarketplaceFee: IEbayAmount;
  buyerCheckoutNotes?: string;
}

export interface IEbayBuyer {
  username: string;
  taxAddress: IEbayAddress;
  buyerRegistrationAddress: IEbayBuyerRegistrationAddress;
}

export interface IEbayAddress {
  stateOrProvince?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface IEbayBuyerRegistrationAddress {
  fullName: string;
  contactAddress: IEbayContactAddress;
  primaryPhone: IEbayPhone;
  secondaryPhone?: IEbayPhone;
  email: string;
}

export interface IEbayContactAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateOrProvince?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface IEbayPhone {
  phoneNumber: string;
}

export interface IEbayPricingSummary {
  priceSubtotal: IEbayAmount;
  deliveryCost: IEbayAmount;
  total: IEbayAmount;
}

export interface IEbayAmount {
  value: string;
  currency: string;
}

export interface IEbayCancelStatus {
  cancelState: string;
  cancelRequests: any[];
}

export interface IEbayPaymentSummary {
  totalDueSeller: IEbayAmount;
  refunds: any[];
  payments: IEbayPayment[];
}

export interface IEbayPayment {
  paymentMethod: string;
  paymentReferenceId: string;
  paymentDate: string;
  amount: IEbayAmount;
  paymentStatus: string;
}

export interface IEbayFulfillmentInstruction {
  fulfillmentInstructionsType: string;
  minEstimatedDeliveryDate: string;
  maxEstimatedDeliveryDate: string;
  ebaySupportedFulfillment?: boolean;
  shippingStep: IEbayShippingStep;
}

export interface IEbayShippingStep {
  shipTo: IEbayShipTo;
  shippingCarrierCode?: string;
  shippingServiceCode: string;
}

export interface IEbayShipTo {
  fullName: string;
  contactAddress: IEbayContactAddress;
  primaryPhone: IEbayPhone;
  email: string;
}

export interface IEbayLineItem {
  lineItemId: string;
  legacyItemId?: string;
  legacyVariationId?: string;
  variationAspects?: IEbayVariationAspect[];
  title: string;
  lineItemCost: IEbayAmount;
  quantity: number;
  soldFormat: string;
  listingMarketplaceId: string;
  purchaseMarketplaceId: string;
  lineItemFulfillmentStatus: string;
  total: IEbayAmount;
  deliveryCost: IEbayDeliveryCost;
  appliedPromotions?: any[];
  taxes?: any[];
  properties?: IEbayLineItemProperties;
  lineItemFulfillmentInstructions?: IEbayLineItemFulfillmentInstructions;
  itemLocation?: IEbayItemLocation;
}

export interface IEbayVariationAspect {
  name: string;
  value: string;
}

export interface IEbayDeliveryCost {
  shippingCost: IEbayAmount;
}

export interface IEbayLineItemProperties {
  buyerProtection: boolean;
  soldViaAdCampaign?: boolean;
}

export interface IEbayLineItemFulfillmentInstructions {
  minEstimatedDeliveryDate: string;
  maxEstimatedDeliveryDate: string;
  shipByDate: string;
  guaranteedDelivery: boolean;
}

export interface IEbayItemLocation {
  location: string;
  countryCode: string;
  postalCode: string;
}

export type EbayOrderModel = Model<IEbayOrder>;
