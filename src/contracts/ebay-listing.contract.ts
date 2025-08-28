import { Model, Types } from "mongoose";

export interface IEbayListing {
  _id: Types.ObjectId;
  itemId: string;
  title?: string;
  listingType?: string;
  listingDuration?: string;
  quantity?: number;
  currency?: string;
  country?: string;
  postalCode?: string;
  location?: string;

  // Pricing
  startPrice?: IEbayPrice;
  buyItNowPrice?: IEbayPrice;
  reservePrice?: IEbayPrice;
  currentPrice?: IEbayPrice;
  convertedCurrentPrice?: IEbayPrice;

  // Listing details
  listingDetails?: IEbayListingDetails;

  // Category
  category?: IEbayCategory;

  // Condition
  condition?: IEbayCondition;

  // Seller information
  seller?: IEbaySeller;

  // Selling status
  sellingStatus?: IEbaySellingStatus;

  // Shipping details
  shipping?: IEbayShippingDetails;

  // Ship to locations
  shipToLocations?: string[];

  // Storefront
  storefront?: IEbayStorefront;

  // Pictures
  pictures?: IEbayPictures;

  // Business seller details
  businessSellerDetails?: IEbayBusinessSellerDetails;

  // Return policy
  returnPolicy?: IEbayReturnPolicy;

  // Variations
  variations?: IEbayVariations;

  // Regulatory
  regulatory?: IEbayRegulatory;

  // Seller profiles
  sellerProfiles?: IEbaySellerProfiles;

  // Shipping package details
  shippingPackageDetails?: IEbayShippingPackageDetails;

  // Other fields
  autoPay?: boolean;
  buyerProtection?: string;
  buyerResponsibleForShipping?: boolean;
  dispatchTimeMax?: number;
  proxyItem?: boolean;
  buyerGuaranteePrice?: IEbayPrice;
  intangibleItem?: boolean;
  relistParentId?: string;
  hideFromSearch?: boolean;
  outOfStockControl?: boolean;
  pickupInStoreDetails?: IEbayPickupInStoreDetails;
  ebayPlus?: boolean;
  ebayPlusEligible?: boolean;
  isSecureDescription?: boolean;

  // VAT details
  vatDetails?: IEbayVatDetails;

  // Time left
  timeLeft?: string;

  // Metadata
  metadata?: IEbayMetadata;

  // Legacy fields for backward compatibility
  legacyItemId?: string;
  shortDescription?: string;
  description?: string;
  price?: IEbayPrice;
  conditionId?: string;
  conditionDescription?: string;
  categoryPath?: string;
  categoryId?: string;
  categoryIdPath?: string[];
  brand?: string;
  mpn?: string;
  color?: string;
  itemLocation?: IEbayItemLocation;
  image?: IEbayImage;
  additionalImages?: IEbayImage[];
  estimatedAvailabilities?: IEbayEstimatedAvailability[];
  legacyShipToLocations?: IEbayShipToLocations;
  returnTerms?: IEbayReturnTerms;
  buyingOptions?: string[];
  paymentMethods?: IEbayPaymentMethod[];
  immediatePay?: boolean;
  enabledForGuestCheckout?: boolean;
  eligibleForInlineCheckout?: boolean;
  adultOnly?: boolean;
  listingMarketplaceId?: string;
  itemCreationDate?: string;
  itemWebUrl?: string;
  itemAffiliateWebUrl?: string;
  topRatedBuyingExperience?: boolean;
  priorityListing?: boolean;
  lotSize?: number;
  unitPricingMeasure?: string;
  unitPrice?: IEbayPrice;
  localizedAspects?: IEbayLocalizedAspect[];
  taxes?: IEbayTax[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEbayPrice {
  value?: string;
  currency?: string;
  convertedFromValue?: string;
  convertedFromCurrency?: string;
}

export interface IEbayListingDetails {
  startTime?: string;
  endTime?: string;
  viewItemUrl?: string;
  hasUnansweredQuestions?: boolean;
  hasPublicMessages?: boolean;
  checkoutEnabled?: boolean;
  adult?: boolean;
  bindingAuction?: boolean;
  hasReservePrice?: boolean;
}

export interface IEbayCategory {
  id?: string;
  name?: string;
  path?: string;
}

export interface IEbayCondition {
  id?: string;
  displayName?: string;
}

export interface IEbaySeller {
  userId?: string;
  email?: string;
  feedbackScore?: number;
  positiveFeedbackPercent?: number;
  feedbackPrivate?: boolean;
  idVerified?: boolean;
  ebayGoodStanding?: boolean;
  newUser?: boolean;
  registrationDate?: string;
  site?: string;
  status?: string;
  vatStatus?: string;
  aboutMePage?: boolean;
  motorsDealer?: boolean;
  sellerInfo?: IEbaySellerInfo;
}

export interface IEbaySellerInfo {
  allowPaymentEdit?: boolean;
  checkoutEnabled?: boolean;
  cipBankAccountStored?: boolean;
  goodStanding?: boolean;
  liveAuctionAuthorized?: boolean;
  merchandizingPref?: string;
  qualifiesForB2BVAT?: boolean;
  storeOwner?: boolean;
  storeUrl?: string;
  safePaymentExempt?: boolean;
}

export interface IEbaySellingStatus {
  bidCount?: number;
  currentPrice?: IEbayPrice;
  convertedCurrentPrice?: IEbayPrice;
  quantitySold?: number;
  reserveMet?: boolean;
  secondChanceEligible?: boolean;
  listingStatus?: string;
  quantitySoldByPickupInStore?: number;
}

export interface IEbayShippingDetails {
  applyShippingDiscount?: boolean;
  globalShipping?: boolean;
  shippingType?: string;
  thirdPartyCheckout?: boolean;
  calculatedShippingRate?: IEbayCalculatedShippingRate;
  salesTax?: IEbaySalesTax;
  shippingServiceOptions?: IEbayShippingServiceOption[];
  rateTableDetails?: IEbayRateTableDetails;
}

export interface IEbayCalculatedShippingRate {
  weightMajor?: IEbayWeight;
  weightMinor?: IEbayWeight;
}

export interface IEbayWeight {
  value?: string;
  measurementSystem?: string;
  unit?: string;
}

export interface IEbaySalesTax {
  salesTaxPercent?: number;
  shippingIncludedInTax?: boolean;
}

export interface IEbayShippingServiceOption {
  service?: string;
  cost?: IEbayPrice;
  additionalCost?: IEbayPrice;
  priority?: number;
  expeditedService?: boolean;
  shippingTimeMin?: number;
  shippingTimeMax?: number;
  freeShipping?: boolean;
}

export interface IEbayRateTableDetails {
  domesticRateTableId?: string;
}

export interface IEbayStorefront {
  storeCategoryId?: string;
  storeCategory2Id?: string;
  storeUrl?: string;
}

export interface IEbayPictures {
  galleryType?: string;
  pictureUrls?: string[];
}

export interface IEbayBusinessSellerDetails {
  address?: IEbayAddress;
  email?: string;
  tradeRegistrationNumber?: string;
  legalInvoice?: boolean;
}

export interface IEbayAddress {
  street1?: string;
  cityName?: string;
  stateOrProvince?: string;
  countryName?: string;
  postalCode?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
}

export interface IEbayReturnPolicy {
  returnsWithinOption?: string;
  returnsWithin?: string;
  returnsAcceptedOption?: string;
  returnsAccepted?: string;
  shippingCostPaidByOption?: string;
  shippingCostPaidBy?: string;
  internationalReturnsAcceptedOption?: string;
  internationalReturnsWithinOption?: string;
  internationalShippingCostPaidByOption?: string;
}

export interface IEbayVariations {
  variations?: IEbayVariation[];
  pictures?: IEbayVariationPictures;
  variationSpecificsSet?: IEbayVariationSpecificsSet;
}

export interface IEbayVariation {
  startPrice?: IEbayPrice;
  quantity?: number;
  variationSpecifics?: Record<string, string[]>;
  sellingStatus?: IEbayVariationSellingStatus;
}

export interface IEbayVariationSellingStatus {
  quantitySold?: number;
  quantitySoldByPickupInStore?: number;
}

export interface IEbayVariationPictures {
  variationSpecificName?: string;
  variationSpecificPictureSets?: IEbayVariationSpecificPictureSet[];
}

export interface IEbayVariationSpecificPictureSet {
  variationSpecificValue?: string;
  pictureUrl?: string;
}

export interface IEbayVariationSpecificsSet {
  [key: string]: string[];
}

export interface IEbayRegulatory {
  productSafety?: IEbayProductSafety;
  manufacturer?: IEbayManufacturer;
  responsiblePersons?: IEbayResponsiblePersons;
}

export interface IEbayProductSafety {
  pictograms?: string[];
  statements?: string[];
}

export interface IEbayManufacturer {
  companyName?: string;
  street1?: string;
  street2?: string;
  cityName?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface IEbayResponsiblePersons {
  responsiblePersons?: IEbayResponsiblePerson[];
}

export interface IEbayResponsiblePerson {
  companyName?: string;
  street1?: string;
  street2?: string;
  cityName?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  types?: string[];
}

export interface IEbaySellerProfiles {
  shippingProfile?: IEbaySellerProfile;
  returnProfile?: IEbaySellerProfile;
  paymentProfile?: IEbaySellerProfile;
}

export interface IEbaySellerProfile {
  id?: string;
  name?: string;
}

export interface IEbayShippingPackageDetails {
  packageDepth?: IEbayDimension;
  packageLength?: IEbayDimension;
  packageWidth?: IEbayDimension;
  shippingIrregular?: boolean;
  shippingPackage?: string;
  weightMajor?: IEbayWeight;
  weightMinor?: IEbayWeight;
}

export interface IEbayDimension {
  value?: string;
  measurementSystem?: string;
  unit?: string;
}

export interface IEbayPickupInStoreDetails {
  availableForPickupInStore?: boolean;
}

export interface IEbayVatDetails {
  vatPercent?: number;
}

export interface IEbayMetadata {
  timestamp?: string;
  ack?: string;
  version?: string;
  build?: string;
}

// Legacy interfaces for backward compatibility
export interface IEbayItemLocation {
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
}

export interface IEbayImage {
  imageUrl?: string;
  width?: number;
  height?: number;
}

export interface IEbaySellerLegalInfo {
  vatDetails?: IEbayVatDetail[];
}

export interface IEbayVatDetail {
  vatId?: string;
  issuingCountry?: string;
}

export interface IEbayEstimatedAvailability {
  estimatedAvailabilityStatus?: string;
  estimatedAvailableQuantity?: number;
  estimatedSoldQuantity?: number;
  estimatedRemainingQuantity?: number;
}

export interface IEbayShipToLocations {
  regionExcluded?: IEbayRegion[];
  regionIncluded?: IEbayRegion[];
}

export interface IEbayRegion {
  regionName?: string;
  regionType?: string;
  regionId?: string;
}

export interface IEbayReturnTerms {
  returnsAccepted?: boolean;
  returnShippingCostPayer?: string;
  returnPeriod?: IEbayReturnPeriod;
}

export interface IEbayReturnPeriod {
  value?: number;
  unit?: string;
}

export interface IEbayPaymentMethod {
  paymentMethodType?: string;
  paymentMethodBrands?: IEbayPaymentMethodBrand[];
}

export interface IEbayPaymentMethodBrand {
  paymentMethodBrandType?: string;
}

export interface IEbayLocalizedAspect {
  type?: string;
  name?: string;
  value?: string;
}

export interface IEbayTax {
  taxJurisdiction?: IEbayTaxJurisdiction;
  taxType?: string;
  shippingAndHandlingTaxed?: boolean;
  includedInPrice?: boolean;
  ebayCollectAndRemitTax?: boolean;
}

export interface IEbayTaxJurisdiction {
  region?: IEbayTaxRegion;
  taxJurisdictionId?: string;
}

export interface IEbayTaxRegion {
  regionName?: string;
  regionType?: string;
}

export interface IEbayListingModel extends Model<IEbayListing> {}
