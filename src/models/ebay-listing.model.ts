import { Schema, model } from "mongoose";
import { IEbayListing, IEbayListingModel } from "@/contracts/ebay-listing.contract";

// Comprehensive sub-schemas for all nested objects (all fields optional)
const EbayPriceSchema = new Schema(
  {
    value: { type: String },
    currency: { type: String },
    convertedFromValue: { type: String },
    convertedFromCurrency: { type: String },
  },
  { _id: false }
);

const EbayListingDetailsSchema = new Schema(
  {
    startTime: { type: String },
    endTime: { type: String },
    viewItemUrl: { type: String },
    hasUnansweredQuestions: { type: Boolean },
    hasPublicMessages: { type: Boolean },
    checkoutEnabled: { type: Boolean },
    adult: { type: Boolean },
    bindingAuction: { type: Boolean },
    hasReservePrice: { type: Boolean },
  },
  { _id: false }
);

const EbayCategorySchema = new Schema(
  {
    id: { type: String },
    name: { type: String },
    path: { type: String },
  },
  { _id: false }
);

const EbayConditionSchema = new Schema(
  {
    id: { type: String },
    displayName: { type: String },
  },
  { _id: false }
);

const EbaySellerInfoSchema = new Schema(
  {
    allowPaymentEdit: { type: Boolean },
    checkoutEnabled: { type: Boolean },
    cipBankAccountStored: { type: Boolean },
    goodStanding: { type: Boolean },
    liveAuctionAuthorized: { type: Boolean },
    merchandizingPref: { type: String },
    qualifiesForB2BVAT: { type: Boolean },
    storeOwner: { type: Boolean },
    storeUrl: { type: String },
    safePaymentExempt: { type: Boolean },
  },
  { _id: false }
);

const EbaySellerSchema = new Schema(
  {
    userId: { type: String, index: true },
    email: { type: String },
    feedbackScore: { type: Number },
    positiveFeedbackPercent: { type: Number },
    feedbackPrivate: { type: Boolean },
    idVerified: { type: Boolean },
    ebayGoodStanding: { type: Boolean },
    newUser: { type: Boolean },
    registrationDate: { type: String },
    site: { type: String },
    status: { type: String },
    vatStatus: { type: String },
    aboutMePage: { type: Boolean },
    motorsDealer: { type: Boolean },
    sellerInfo: EbaySellerInfoSchema,
  },
  { _id: false }
);

const EbaySellingStatusSchema = new Schema(
  {
    bidCount: { type: Number },
    currentPrice: EbayPriceSchema,
    convertedCurrentPrice: EbayPriceSchema,
    quantitySold: { type: Number },
    reserveMet: { type: Boolean },
    secondChanceEligible: { type: Boolean },
    listingStatus: { type: String },
    quantitySoldByPickupInStore: { type: Number },
  },
  { _id: false }
);

const EbayWeightSchema = new Schema(
  {
    value: { type: String },
    measurementSystem: { type: String },
    unit: { type: String },
  },
  { _id: false }
);

const EbayCalculatedShippingRateSchema = new Schema(
  {
    weightMajor: EbayWeightSchema,
    weightMinor: EbayWeightSchema,
  },
  { _id: false }
);

const EbaySalesTaxSchema = new Schema(
  {
    salesTaxPercent: { type: Number },
    shippingIncludedInTax: { type: Boolean },
  },
  { _id: false }
);

const EbayShippingServiceOptionSchema = new Schema(
  {
    service: { type: String },
    cost: EbayPriceSchema,
    additionalCost: EbayPriceSchema,
    priority: { type: Number },
    expeditedService: { type: Boolean },
    shippingTimeMin: { type: Number },
    shippingTimeMax: { type: Number },
    freeShipping: { type: Boolean },
  },
  { _id: false }
);

const EbayRateTableDetailsSchema = new Schema(
  {
    domesticRateTableId: { type: String },
  },
  { _id: false }
);

const EbayShippingDetailsSchema = new Schema(
  {
    applyShippingDiscount: { type: Boolean },
    globalShipping: { type: Boolean },
    shippingType: { type: String },
    thirdPartyCheckout: { type: Boolean },
    calculatedShippingRate: EbayCalculatedShippingRateSchema,
    salesTax: EbaySalesTaxSchema,
    shippingServiceOptions: [EbayShippingServiceOptionSchema],
    rateTableDetails: EbayRateTableDetailsSchema,
  },
  { _id: false }
);

const EbayStorefrontSchema = new Schema(
  {
    storeCategoryId: { type: String },
    storeCategory2Id: { type: String },
    storeUrl: { type: String },
  },
  { _id: false }
);

const EbayPicturesSchema = new Schema(
  {
    galleryType: { type: String },
    pictureUrls: [{ type: String }],
  },
  { _id: false }
);

const EbayAddressSchema = new Schema(
  {
    street1: { type: String },
    cityName: { type: String },
    stateOrProvince: { type: String },
    countryName: { type: String },
    postalCode: { type: String },
    companyName: { type: String },
    firstName: { type: String },
    lastName: { type: String },
  },
  { _id: false }
);

const EbayBusinessSellerDetailsSchema = new Schema(
  {
    address: EbayAddressSchema,
    email: { type: String },
    tradeRegistrationNumber: { type: String },
    legalInvoice: { type: Boolean },
  },
  { _id: false }
);

const EbayReturnPolicySchema = new Schema(
  {
    returnsWithinOption: { type: String },
    returnsWithin: { type: String },
    returnsAcceptedOption: { type: String },
    returnsAccepted: { type: String },
    shippingCostPaidByOption: { type: String },
    shippingCostPaidBy: { type: String },
    internationalReturnsAcceptedOption: { type: String },
    internationalReturnsWithinOption: { type: String },
    internationalShippingCostPaidByOption: { type: String },
  },
  { _id: false }
);

const EbayVariationSellingStatusSchema = new Schema(
  {
    quantitySold: { type: Number },
    quantitySoldByPickupInStore: { type: Number },
  },
  { _id: false }
);

const EbayVariationSchema = new Schema(
  {
    startPrice: EbayPriceSchema,
    quantity: { type: Number },
    variationSpecifics: { type: Schema.Types.Mixed }, // Record<string, string[]>
    sellingStatus: EbayVariationSellingStatusSchema,
  },
  { _id: false }
);

const EbayVariationSpecificPictureSetSchema = new Schema(
  {
    variationSpecificValue: { type: String },
    pictureUrl: { type: String },
  },
  { _id: false }
);

const EbayVariationPicturesSchema = new Schema(
  {
    variationSpecificName: { type: String },
    variationSpecificPictureSets: [EbayVariationSpecificPictureSetSchema],
  },
  { _id: false }
);

const EbayVariationsSchema = new Schema(
  {
    variations: [EbayVariationSchema],
    pictures: EbayVariationPicturesSchema,
    variationSpecificsSet: { type: Schema.Types.Mixed }, // Record<string, string[]>
  },
  { _id: false }
);

const EbayProductSafetySchema = new Schema(
  {
    pictograms: [{ type: String }],
    statements: [{ type: String }],
  },
  { _id: false }
);

const EbayManufacturerSchema = new Schema(
  {
    companyName: { type: String },
    street1: { type: String },
    street2: { type: String },
    cityName: { type: String },
    postalCode: { type: String },
    country: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  { _id: false }
);

const EbayResponsiblePersonSchema = new Schema(
  {
    companyName: { type: String },
    street1: { type: String },
    street2: { type: String },
    cityName: { type: String },
    postalCode: { type: String },
    country: { type: String },
    phone: { type: String },
    email: { type: String },
    types: [{ type: String }],
  },
  { _id: false }
);

const EbayResponsiblePersonsSchema = new Schema(
  {
    responsiblePersons: [EbayResponsiblePersonSchema],
  },
  { _id: false }
);

const EbayRegulatorySchema = new Schema(
  {
    productSafety: EbayProductSafetySchema,
    manufacturer: EbayManufacturerSchema,
    responsiblePersons: EbayResponsiblePersonsSchema,
  },
  { _id: false }
);

const EbaySellerProfileSchema = new Schema(
  {
    id: { type: String },
    name: { type: String },
  },
  { _id: false }
);

const EbaySellerProfilesSchema = new Schema(
  {
    shippingProfile: EbaySellerProfileSchema,
    returnProfile: EbaySellerProfileSchema,
    paymentProfile: EbaySellerProfileSchema,
  },
  { _id: false }
);

const EbayDimensionSchema = new Schema(
  {
    value: { type: String },
    measurementSystem: { type: String },
    unit: { type: String },
  },
  { _id: false }
);

const EbayShippingPackageDetailsSchema = new Schema(
  {
    packageDepth: EbayDimensionSchema,
    packageLength: EbayDimensionSchema,
    packageWidth: EbayDimensionSchema,
    shippingIrregular: { type: Boolean },
    shippingPackage: { type: String },
    weightMajor: EbayWeightSchema,
    weightMinor: EbayWeightSchema,
  },
  { _id: false }
);

const EbayPickupInStoreDetailsSchema = new Schema(
  {
    availableForPickupInStore: { type: Boolean },
  },
  { _id: false }
);

const EbayVatDetailsSchema = new Schema(
  {
    vatPercent: { type: Number },
  },
  { _id: false }
);

const EbayMetadataSchema = new Schema(
  {
    timestamp: { type: String },
    ack: { type: String },
    version: { type: String },
    build: { type: String },
  },
  { _id: false }
);

// Legacy schemas for backward compatibility
const EbayItemLocationSchema = new Schema(
  {
    city: { type: String },
    stateOrProvince: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  { _id: false }
);

const EbayImageSchema = new Schema(
  {
    imageUrl: { type: String },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

const EbayVatDetailSchema = new Schema(
  {
    vatId: { type: String },
    issuingCountry: { type: String },
  },
  { _id: false }
);

const EbaySellerLegalInfoSchema = new Schema(
  {
    vatDetails: [EbayVatDetailSchema],
  },
  { _id: false }
);

const EbayEstimatedAvailabilitySchema = new Schema(
  {
    estimatedAvailabilityStatus: { type: String },
    estimatedAvailableQuantity: { type: Number },
    estimatedSoldQuantity: { type: Number },
    estimatedRemainingQuantity: { type: Number },
  },
  { _id: false }
);

const EbayRegionSchema = new Schema(
  {
    regionName: { type: String },
    regionType: { type: String },
    regionId: { type: String },
  },
  { _id: false }
);

const EbayShipToLocationsSchema = new Schema(
  {
    regionExcluded: [EbayRegionSchema],
    regionIncluded: [EbayRegionSchema],
  },
  { _id: false }
);

const EbayReturnPeriodSchema = new Schema(
  {
    value: { type: Number },
    unit: { type: String },
  },
  { _id: false }
);

const EbayReturnTermsSchema = new Schema(
  {
    returnsAccepted: { type: Boolean },
    returnShippingCostPayer: { type: String },
    returnPeriod: EbayReturnPeriodSchema,
  },
  { _id: false }
);

const EbayPaymentMethodBrandSchema = new Schema(
  {
    paymentMethodBrandType: { type: String },
  },
  { _id: false }
);

const EbayPaymentMethodSchema = new Schema(
  {
    paymentMethodType: { type: String },
    paymentMethodBrands: [EbayPaymentMethodBrandSchema],
  },
  { _id: false }
);

const EbayLocalizedAspectSchema = new Schema(
  {
    type: { type: String },
    name: { type: String },
    value: { type: String },
  },
  { _id: false }
);

const EbayTaxRegionSchema = new Schema(
  {
    regionName: { type: String },
    regionType: { type: String },
  },
  { _id: false }
);

const EbayTaxJurisdictionSchema = new Schema(
  {
    region: EbayTaxRegionSchema,
    taxJurisdictionId: { type: String },
  },
  { _id: false }
);

const EbayTaxSchema = new Schema(
  {
    taxJurisdiction: EbayTaxJurisdictionSchema,
    taxType: { type: String },
    shippingAndHandlingTaxed: { type: Boolean },
    includedInPrice: { type: Boolean },
    ebayCollectAndRemitTax: { type: Boolean },
  },
  { _id: false }
);

// Comprehensive main schema with most fields optional
const EbayListingSchema = new Schema<IEbayListing>(
  {
    itemId: { type: String, required: true, unique: true, index: true },
    title: { type: String, index: true },
    listingType: { type: String },
    listingDuration: { type: String },
    quantity: { type: Number },
    currency: { type: String },
    country: { type: String },
    postalCode: { type: String },
    location: { type: String },

    // Pricing
    startPrice: EbayPriceSchema,
    buyItNowPrice: EbayPriceSchema,
    reservePrice: EbayPriceSchema,
    currentPrice: EbayPriceSchema,
    convertedCurrentPrice: EbayPriceSchema,

    // Listing details
    listingDetails: EbayListingDetailsSchema,

    // Category
    category: EbayCategorySchema,

    // Condition
    condition: EbayConditionSchema,

    // Seller information
    seller: EbaySellerSchema,

    // Selling status
    sellingStatus: EbaySellingStatusSchema,

    // Shipping details
    shipping: EbayShippingDetailsSchema,

    // Ship to locations
    shipToLocations: [{ type: String }],

    // Storefront
    storefront: EbayStorefrontSchema,

    // Pictures
    pictures: EbayPicturesSchema,

    // Business seller details
    businessSellerDetails: EbayBusinessSellerDetailsSchema,

    // Return policy
    returnPolicy: EbayReturnPolicySchema,

    // Variations
    variations: EbayVariationsSchema,

    // Regulatory
    regulatory: EbayRegulatorySchema,

    // Seller profiles
    sellerProfiles: EbaySellerProfilesSchema,

    // Shipping package details
    shippingPackageDetails: EbayShippingPackageDetailsSchema,

    // Other fields
    autoPay: { type: Boolean },
    buyerProtection: { type: String },
    buyerResponsibleForShipping: { type: Boolean },
    dispatchTimeMax: { type: Number },
    proxyItem: { type: Boolean },
    buyerGuaranteePrice: EbayPriceSchema,
    intangibleItem: { type: Boolean },
    relistParentId: { type: String },
    hideFromSearch: { type: Boolean },
    outOfStockControl: { type: Boolean },
    pickupInStoreDetails: EbayPickupInStoreDetailsSchema,
    ebayPlus: { type: Boolean },
    ebayPlusEligible: { type: Boolean },
    isSecureDescription: { type: Boolean },

    // VAT details
    vatDetails: EbayVatDetailsSchema,

    // Time left
    timeLeft: { type: String },

    // Metadata
    metadata: EbayMetadataSchema,

    // Legacy fields for backward compatibility
    legacyItemId: { type: String, index: true },
    shortDescription: { type: String },
    description: { type: String },
    price: EbayPriceSchema,
    conditionId: { type: String, index: true },
    conditionDescription: { type: String },
    categoryPath: { type: String, index: true },
    categoryId: { type: String, index: true },
    categoryIdPath: [{ type: String }],
    brand: { type: String, index: true },
    mpn: { type: String, index: true },
    color: { type: String, index: true },
    itemLocation: EbayItemLocationSchema,
    image: EbayImageSchema,
    additionalImages: [EbayImageSchema],
    estimatedAvailabilities: [EbayEstimatedAvailabilitySchema],
    legacyShipToLocations: EbayShipToLocationsSchema,
    returnTerms: EbayReturnTermsSchema,
    buyingOptions: [{ type: String }],
    paymentMethods: [EbayPaymentMethodSchema],
    immediatePay: { type: Boolean },
    enabledForGuestCheckout: { type: Boolean },
    eligibleForInlineCheckout: { type: Boolean },
    adultOnly: { type: Boolean },
    listingMarketplaceId: { type: String, index: true },
    itemCreationDate: { type: String },
    itemWebUrl: { type: String },
    itemAffiliateWebUrl: { type: String },
    topRatedBuyingExperience: { type: Boolean },
    priorityListing: { type: Boolean },
    lotSize: { type: Number },
    unitPricingMeasure: { type: String },
    unitPrice: EbayPriceSchema,
    localizedAspects: [EbayLocalizedAspectSchema],
    taxes: [EbayTaxSchema],
  },
  {
    timestamps: true,
    collection: "ebay_listings",
  }
);

// Comprehensive indexes for optimal query performance
EbayListingSchema.index({ "seller.userId": 1 });
EbayListingSchema.index({ "price.value": 1 });
EbayListingSchema.index({ "startPrice.value": 1 });
EbayListingSchema.index({ "currentPrice.value": 1 });
EbayListingSchema.index({ "convertedCurrentPrice.value": 1 });
EbayListingSchema.index({ "sellingStatus.listingStatus": 1 });
EbayListingSchema.index({ "sellingStatus.quantitySold": 1 });
EbayListingSchema.index({ "category.id": 1 });
EbayListingSchema.index({ "category.name": 1 });
EbayListingSchema.index({ "condition.id": 1 });
EbayListingSchema.index({ "condition.displayName": 1 });
EbayListingSchema.index({ "shipping.shippingType": 1 });
EbayListingSchema.index({ "variations.variations.quantity": 1 });
EbayListingSchema.index({ "variations.variations.startPrice.value": 1 });
EbayListingSchema.index({ "businessSellerDetails.address.countryName": 1 });
EbayListingSchema.index({ "businessSellerDetails.address.cityName": 1 });
EbayListingSchema.index({ "businessSellerDetails.address.postalCode": 1 });
EbayListingSchema.index({ "regulatory.manufacturer.companyName": 1 });
EbayListingSchema.index({ "regulatory.manufacturer.country": 1 });
EbayListingSchema.index({ "sellerProfiles.shippingProfile.id": 1 });
EbayListingSchema.index({ "sellerProfiles.returnProfile.id": 1 });
EbayListingSchema.index({ "sellerProfiles.paymentProfile.id": 1 });
EbayListingSchema.index({ "shippingPackageDetails.weightMajor.value": 1 });
EbayListingSchema.index({ "shippingPackageDetails.weightMinor.value": 1 });
EbayListingSchema.index({ "pictures.pictureUrls": 1 });
EbayListingSchema.index({ "returnPolicy.returnsAccepted": 1 });
EbayListingSchema.index({ "returnPolicy.returnsWithin": 1 });
EbayListingSchema.index({ "vatDetails.vatPercent": 1 });
EbayListingSchema.index({ "metadata.timestamp": 1 });
EbayListingSchema.index({ "metadata.ack": 1 });
EbayListingSchema.index({ timeLeft: 1 });
EbayListingSchema.index({ listingType: 1 });
EbayListingSchema.index({ listingDuration: 1 });
EbayListingSchema.index({ currency: 1 });
EbayListingSchema.index({ country: 1 });
EbayListingSchema.index({ postalCode: 1 });
EbayListingSchema.index({ location: 1 });
EbayListingSchema.index({ autoPay: 1 });
EbayListingSchema.index({ buyerProtection: 1 });
EbayListingSchema.index({ buyerResponsibleForShipping: 1 });
EbayListingSchema.index({ dispatchTimeMax: 1 });
EbayListingSchema.index({ proxyItem: 1 });
EbayListingSchema.index({ intangibleItem: 1 });
EbayListingSchema.index({ hideFromSearch: 1 });
EbayListingSchema.index({ outOfStockControl: 1 });
EbayListingSchema.index({ ebayPlus: 1 });
EbayListingSchema.index({ ebayPlusEligible: 1 });
EbayListingSchema.index({ isSecureDescription: 1 });
EbayListingSchema.index({ relistParentId: 1 });
EbayListingSchema.index({ "buyerGuaranteePrice.value": 1 });
EbayListingSchema.index({ "shipping.applyShippingDiscount": 1 });
EbayListingSchema.index({ "shipping.globalShipping": 1 });
EbayListingSchema.index({ "shipping.thirdPartyCheckout": 1 });
EbayListingSchema.index({ "shipping.salesTax.salesTaxPercent": 1 });
EbayListingSchema.index({ "shipping.shippingServiceOptions.service": 1 });
EbayListingSchema.index({ "shipping.shippingServiceOptions.freeShipping": 1 });
EbayListingSchema.index({ "shipping.shippingServiceOptions.expeditedService": 1 });
EbayListingSchema.index({ "shipping.calculatedShippingRate.weightMajor.value": 1 });
EbayListingSchema.index({ "shipping.calculatedShippingRate.weightMinor.value": 1 });
EbayListingSchema.index({ "shippingPackageDetails.shippingIrregular": 1 });
EbayListingSchema.index({ "shippingPackageDetails.shippingPackage": 1 });
EbayListingSchema.index({ "shippingPackageDetails.packageDepth.value": 1 });
EbayListingSchema.index({ "shippingPackageDetails.packageLength.value": 1 });
EbayListingSchema.index({ "shippingPackageDetails.packageWidth.value": 1 });
EbayListingSchema.index({ "storefront.storeCategoryId": 1 });
EbayListingSchema.index({ "storefront.storeUrl": 1 });
EbayListingSchema.index({ "pictures.galleryType": 1 });
EbayListingSchema.index({ "businessSellerDetails.tradeRegistrationNumber": 1 });
EbayListingSchema.index({ "businessSellerDetails.legalInvoice": 1 });
EbayListingSchema.index({ "regulatory.productSafety.pictograms": 1 });
EbayListingSchema.index({ "regulatory.productSafety.statements": 1 });
EbayListingSchema.index({ "regulatory.responsiblePersons.responsiblePersons.types": 1 });
EbayListingSchema.index({ "variations.variations.variationSpecifics": 1 });
EbayListingSchema.index({ "variations.pictures.variationSpecificName": 1 });
EbayListingSchema.index({ "variations.variationSpecificsSet": 1 });
EbayListingSchema.index({ "returnPolicy.returnsWithinOption": 1 });
EbayListingSchema.index({ "returnPolicy.returnsAcceptedOption": 1 });
EbayListingSchema.index({ "returnPolicy.shippingCostPaidByOption": 1 });
EbayListingSchema.index({ "returnPolicy.internationalReturnsAcceptedOption": 1 });
EbayListingSchema.index({ "returnPolicy.internationalReturnsWithinOption": 1 });
EbayListingSchema.index({ "returnPolicy.internationalShippingCostPaidByOption": 1 });
EbayListingSchema.index({ "pickupInStoreDetails.availableForPickupInStore": 1 });
EbayListingSchema.index({ "shipping.rateTableDetails.domesticRateTableId": 1 });
EbayListingSchema.index({ "shipping.shippingServiceOptions.priority": 1 });
EbayListingSchema.index({ "shipping.shippingServiceOptions.shippingTimeMin": 1 });
EbayListingSchema.index({ "shipping.shippingServiceOptions.shippingTimeMax": 1 });
EbayListingSchema.index({ "variations.variations.sellingStatus.quantitySold": 1 });
EbayListingSchema.index({ "variations.variations.sellingStatus.quantitySoldByPickupInStore": 1 });
EbayListingSchema.index({ "seller.ebayGoodStanding": 1 });
EbayListingSchema.index({ "seller.newUser": 1 });
EbayListingSchema.index({ "seller.status": 1 });
EbayListingSchema.index({ "seller.vatStatus": 1 });
EbayListingSchema.index({ "seller.aboutMePage": 1 });
EbayListingSchema.index({ "seller.motorsDealer": 1 });
EbayListingSchema.index({ "seller.sellerInfo.allowPaymentEdit": 1 });
EbayListingSchema.index({ "seller.sellerInfo.checkoutEnabled": 1 });
EbayListingSchema.index({ "seller.sellerInfo.cipBankAccountStored": 1 });
EbayListingSchema.index({ "seller.sellerInfo.goodStanding": 1 });
EbayListingSchema.index({ "seller.sellerInfo.liveAuctionAuthorized": 1 });
EbayListingSchema.index({ "seller.sellerInfo.merchandizingPref": 1 });
EbayListingSchema.index({ "seller.sellerInfo.qualifiesForB2BVAT": 1 });
EbayListingSchema.index({ "seller.sellerInfo.storeOwner": 1 });
EbayListingSchema.index({ "seller.sellerInfo.safePaymentExempt": 1 });
EbayListingSchema.index({ "sellingStatus.bidCount": 1 });
EbayListingSchema.index({ "sellingStatus.reserveMet": 1 });
EbayListingSchema.index({ "sellingStatus.secondChanceEligible": 1 });
EbayListingSchema.index({ "sellingStatus.quantitySoldByPickupInStore": 1 });
EbayListingSchema.index({ "listingDetails.hasUnansweredQuestions": 1 });
EbayListingSchema.index({ "listingDetails.hasPublicMessages": 1 });
EbayListingSchema.index({ "listingDetails.checkoutEnabled": 1 });
EbayListingSchema.index({ "listingDetails.adult": 1 });
EbayListingSchema.index({ "listingDetails.bindingAuction": 1 });
EbayListingSchema.index({ "listingDetails.hasReservePrice": 1 });
EbayListingSchema.index({ "listingDetails.startTime": 1 });
EbayListingSchema.index({ "listingDetails.endTime": 1 });
EbayListingSchema.index({ "listingDetails.viewItemUrl": 1 });
EbayListingSchema.index({ "listingDetails.viewItemURLForNaturalSearch": 1 });
EbayListingSchema.index({ "category.path": 1 });
EbayListingSchema.index({ "condition.displayName": 1 });
EbayListingSchema.index({ brand: 1, "itemLocation.country": 1 });

export const EbayListing = model<IEbayListing, IEbayListingModel>("EbayListing", EbayListingSchema);
