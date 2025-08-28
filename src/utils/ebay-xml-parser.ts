import { XMLParser } from "fast-xml-parser";

export interface IEbayXmlItem {
  AutoPay?: string;
  BuyerProtection?: string;
  BuyItNowPrice?: IEbayXmlPrice;
  Country?: string;
  Currency?: string;
  ItemID?: string;
  ListingDetails?: IEbayXmlListingDetails;
  ListingDuration?: string;
  ListingType?: string;
  Location?: string;
  PrimaryCategory?: IEbayXmlCategory;
  PrivateListing?: string;
  Quantity?: string;
  IsItemEMSEligible?: string;
  ReservePrice?: IEbayXmlPrice;
  ReviseStatus?: IEbayXmlReviseStatus;
  Seller?: IEbayXmlSeller;
  SellingStatus?: IEbayXmlSellingStatus;
  ShippingDetails?: IEbayXmlShippingDetails;
  ShipToLocations?: string | string[];
  Site?: string;
  StartPrice?: IEbayXmlPrice;
  Storefront?: IEbayXmlStorefront;
  TimeLeft?: string;
  Title?: string;
  VATDetails?: IEbayXmlVatDetails;
  BuyerResponsibleForShipping?: string;
  PostalCode?: string;
  PictureDetails?: IEbayXmlPictureDetails;
  DispatchTimeMax?: string;
  ProxyItem?: string;
  BusinessSellerDetails?: IEbayXmlBusinessSellerDetails;
  BuyerGuaranteePrice?: IEbayXmlPrice;
  IntangibleItem?: string;
  ReturnPolicy?: IEbayXmlReturnPolicy;
  Variations?: IEbayXmlVariations;
  ConditionID?: string;
  ConditionDisplayName?: string;
  Regulatory?: IEbayXmlRegulatory;
  PostCheckoutExperienceEnabled?: string;
  SellerProfiles?: IEbayXmlSellerProfiles;
  ShippingPackageDetails?: IEbayXmlShippingPackageDetails;
  RelistParentID?: string;
  HideFromSearch?: string;
  OutOfStockControl?: string;
  PickupInStoreDetails?: IEbayXmlPickupInStoreDetails;
  eBayPlus?: string;
  eBayPlusEligible?: string;
  IsSecureDescription?: string;
}

export interface IEbayXmlPrice {
  _currencyID?: string;
  __text?: string;
}

export interface IEbayXmlListingDetails {
  Adult?: string;
  BindingAuction?: string;
  CheckoutEnabled?: string;
  ConvertedBuyItNowPrice?: IEbayXmlPrice;
  ConvertedStartPrice?: IEbayXmlPrice;
  ConvertedReservePrice?: IEbayXmlPrice;
  HasReservePrice?: string;
  StartTime?: string;
  EndTime?: string;
  ViewItemURL?: string;
  HasUnansweredQuestions?: string;
  HasPublicMessages?: string;
  ViewItemURLForNaturalSearch?: string;
}

export interface IEbayXmlCategory {
  CategoryID?: string;
  CategoryName?: string;
}

export interface IEbayXmlReviseStatus {
  ItemRevised?: string;
}

export interface IEbayXmlSeller {
  AboutMePage?: string;
  Email?: string;
  FeedbackScore?: string;
  PositiveFeedbackPercent?: string;
  FeedbackPrivate?: string;
  IDVerified?: string;
  eBayGoodStanding?: string;
  NewUser?: string;
  RegistrationDate?: string;
  Site?: string;
  Status?: string;
  UserID?: string;
  UserIDChanged?: string;
  UserIDLastChanged?: string;
  VATStatus?: string;
  SellerInfo?: IEbayXmlSellerInfo;
  MotorsDealer?: string;
}

export interface IEbayXmlSellerInfo {
  AllowPaymentEdit?: string;
  CheckoutEnabled?: string;
  CIPBankAccountStored?: string;
  GoodStanding?: string;
  LiveAuctionAuthorized?: string;
  MerchandizingPref?: string;
  QualifiesForB2BVAT?: string;
  StoreOwner?: string;
  StoreURL?: string;
  SafePaymentExempt?: string;
}

export interface IEbayXmlSellingStatus {
  BidCount?: string;
  BidIncrement?: IEbayXmlPrice;
  ConvertedCurrentPrice?: IEbayXmlPrice;
  CurrentPrice?: IEbayXmlPrice;
  LeadCount?: string;
  MinimumToBid?: IEbayXmlPrice;
  QuantitySold?: string;
  ReserveMet?: string;
  SecondChanceEligible?: string;
  ListingStatus?: string;
  QuantitySoldByPickupInStore?: string;
}

export interface IEbayXmlShippingDetails {
  ApplyShippingDiscount?: string;
  GlobalShipping?: string;
  CalculatedShippingRate?: IEbayXmlCalculatedShippingRate;
  SalesTax?: IEbayXmlSalesTax;
  ShippingServiceOptions?: IEbayXmlShippingServiceOption | IEbayXmlShippingServiceOption[];
  ShippingType?: string;
  ThirdPartyCheckout?: string;
  ShippingDiscountProfileID?: string;
  InternationalShippingDiscountProfileID?: string;
  SellerExcludeShipToLocationsPreference?: string;
  RateTableDetails?: IEbayXmlRateTableDetails;
}

export interface IEbayXmlCalculatedShippingRate {
  WeightMajor?: IEbayXmlWeight;
  WeightMinor?: IEbayXmlWeight;
}

export interface IEbayXmlWeight {
  _measurementSystem?: string;
  _unit?: string;
  __text?: string;
}

export interface IEbayXmlSalesTax {
  SalesTaxPercent?: string;
  ShippingIncludedInTax?: string;
}

export interface IEbayXmlShippingServiceOption {
  ShippingService?: string;
  ShippingServiceCost?: IEbayXmlPrice;
  ShippingServiceAdditionalCost?: IEbayXmlPrice;
  ShippingServicePriority?: string;
  ExpeditedService?: string;
  ShippingTimeMin?: string;
  ShippingTimeMax?: string;
  FreeShipping?: string;
}

export interface IEbayXmlRateTableDetails {
  DomesticRateTableId?: string;
}

export interface IEbayXmlStorefront {
  StoreCategoryID?: string;
  StoreCategory2ID?: string;
  StoreURL?: string;
}

export interface IEbayXmlVatDetails {
  VATPercent?: string;
}

export interface IEbayXmlPictureDetails {
  GalleryType?: string;
  PictureURL?: string | string[];
}

export interface IEbayXmlBusinessSellerDetails {
  Address?: IEbayXmlAddress;
  Email?: string;
  TradeRegistrationNumber?: string;
  LegalInvoice?: string;
}

export interface IEbayXmlAddress {
  Street1?: string;
  CityName?: string;
  StateOrProvince?: string;
  CountryName?: string;
  PostalCode?: string;
  CompanyName?: string;
  FirstName?: string;
  LastName?: string;
}

export interface IEbayXmlReturnPolicy {
  ReturnsWithinOption?: string;
  ReturnsWithin?: string;
  ReturnsAcceptedOption?: string;
  ReturnsAccepted?: string;
  ShippingCostPaidByOption?: string;
  ShippingCostPaidBy?: string;
  InternationalReturnsAcceptedOption?: string;
  InternationalReturnsWithinOption?: string;
  InternationalShippingCostPaidByOption?: string;
}

export interface IEbayXmlVariations {
  Variation?: IEbayXmlVariation | IEbayXmlVariation[];
  Pictures?: IEbayXmlVariationPictures;
  VariationSpecificsSet?: IEbayXmlVariationSpecificsSet;
}

export interface IEbayXmlVariation {
  StartPrice?: IEbayXmlPrice;
  Quantity?: string;
  VariationSpecifics?: IEbayXmlVariationSpecifics;
  SellingStatus?: IEbayXmlVariationSellingStatus;
}

export interface IEbayXmlVariationSpecifics {
  NameValueList?: IEbayXmlNameValueList | IEbayXmlNameValueList[];
}

export interface IEbayXmlNameValueList {
  Name?: string;
  Value?: string | string[];
}

export interface IEbayXmlVariationSellingStatus {
  QuantitySold?: string;
  QuantitySoldByPickupInStore?: string;
}

export interface IEbayXmlVariationPictures {
  VariationSpecificName?: string;
  VariationSpecificPictureSet?: IEbayXmlVariationSpecificPictureSet | IEbayXmlVariationSpecificPictureSet[];
}

export interface IEbayXmlVariationSpecificPictureSet {
  VariationSpecificValue?: string;
  PictureURL?: string;
}

export interface IEbayXmlVariationSpecificsSet {
  NameValueList?: IEbayXmlNameValueList | IEbayXmlNameValueList[];
}

export interface IEbayXmlRegulatory {
  ProductSafety?: IEbayXmlProductSafety;
  Manufacturer?: IEbayXmlManufacturer;
  ResponsiblePersons?: IEbayXmlResponsiblePersons;
}

export interface IEbayXmlProductSafety {
  Pictograms?: IEbayXmlPictograms;
  Statements?: IEbayXmlStatements;
}

export interface IEbayXmlPictograms {
  Pictogram?: string | string[];
}

export interface IEbayXmlStatements {
  Statement?: string | string[];
}

export interface IEbayXmlManufacturer {
  CompanyName?: string;
  Street1?: string;
  Street2?: string;
  CityName?: string;
  PostalCode?: string;
  Country?: string;
  Phone?: string;
  Email?: string;
}

export interface IEbayXmlResponsiblePersons {
  ResponsiblePerson?: IEbayXmlResponsiblePerson | IEbayXmlResponsiblePerson[];
}

export interface IEbayXmlResponsiblePerson {
  CompanyName?: string;
  Street1?: string;
  Street2?: string;
  CityName?: string;
  PostalCode?: string;
  Country?: string;
  Phone?: string;
  Email?: string;
  Types?: IEbayXmlTypes;
}

export interface IEbayXmlTypes {
  Type?: string | string[];
}

export interface IEbayXmlSellerProfiles {
  SellerShippingProfile?: IEbayXmlSellerProfile;
  SellerReturnProfile?: IEbayXmlSellerProfile;
  SellerPaymentProfile?: IEbayXmlSellerProfile;
}

export interface IEbayXmlSellerProfile {
  ShippingProfileID?: string;
  ShippingProfileName?: string;
  ReturnProfileID?: string;
  ReturnProfileName?: string;
  PaymentProfileID?: string;
  PaymentProfileName?: string;
}

export interface IEbayXmlShippingPackageDetails {
  PackageDepth?: IEbayXmlDimension;
  PackageLength?: IEbayXmlDimension;
  PackageWidth?: IEbayXmlDimension;
  ShippingIrregular?: string;
  ShippingPackage?: string;
  WeightMajor?: IEbayXmlWeight;
  WeightMinor?: IEbayXmlWeight;
}

export interface IEbayXmlDimension {
  _measurementSystem?: string;
  _unit?: string;
  __text?: string;
}

export interface IEbayXmlPickupInStoreDetails {
  AvailableForPickupInStore?: string;
}

export interface IEbayXmlResponse {
  GetItemResponse?: {
    Timestamp?: string;
    Ack?: string;
    Version?: string;
    Build?: string;
    Item?: IEbayXmlItem;
  };
}

export class EbayXmlParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "_",
      textNodeName: "__text",
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    });
  }

  /**
   * Parse eBay XML response to structured JSON
   */
  parseXml(xmlString: string): IEbayXmlResponse {
    try {
      if (!xmlString || typeof xmlString !== "string") {
        throw new Error("Invalid XML input: must be a non-empty string");
      }

      const parsed = this.parser.parse(xmlString);

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Failed to parse XML: parser returned invalid result");
      }

      const normalized = this.normalizeArrays(parsed);

      // Validate the parsed structure
      if (!normalized.GetItemResponse) {
        throw new Error("Invalid XML structure: missing GetItemResponse");
      }

      return normalized;
    } catch (error) {
      console.error("Error parsing eBay XML:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse eBay XML: ${errorMessage}`);
    }
  }

  /**
   * Normalize arrays - ensure single items are wrapped in arrays where appropriate
   */
  private normalizeArrays(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.normalizeArrays(item));
    }

    const normalized: any = {};

    try {
      for (const [key, value] of Object.entries(obj)) {
        if (this.isArrayField(key)) {
          // Handle fields that should always be arrays
          if (Array.isArray(value)) {
            normalized[key] = value.map((item) => this.normalizeArrays(item));
          } else if (value !== undefined && value !== null) {
            normalized[key] = [this.normalizeArrays(value)];
          } else {
            normalized[key] = [];
          }
        } else {
          normalized[key] = this.normalizeArrays(value);
        }
      }
    } catch (error) {
      console.error("Error in normalizeArrays:", error);
      return obj; // Return original object if normalization fails
    }

    return normalized;
  }

  /**
   * Check if a field should always be treated as an array
   */
  private isArrayField(fieldName: string): boolean {
    const arrayFields = [
      "ShipToLocations",
      "PictureURL",
      "Variation",
      "NameValueList",
      "VariationSpecificPictureSet",
      "Pictogram",
      "Statement",
      "ResponsiblePerson",
      "Type",
    ];

    return arrayFields.includes(fieldName);
  }

  /**
   * Validate and clean data to ensure it meets database schema requirements
   */
  private validateAndCleanData(data: any): any {
    try {
      // Deep clone the data to avoid modifying the original
      const cleanedData = JSON.parse(JSON.stringify(data));

      // Ensure all price values are strings
      this.ensurePriceValuesAreStrings(cleanedData);

      // Ensure all weight/dimension values are strings
      this.ensureWeightDimensionValuesAreStrings(cleanedData);

      // Ensure pictureUrl is always a string, not an array
      this.ensurePictureUrlIsString(cleanedData);

      // Ensure all numeric fields that should be strings are properly converted
      this.ensureNumericFieldsAreStrings(cleanedData);

      // Final validation to catch any remaining issues
      this.checkForObjectValues(cleanedData);

      return cleanedData;
    } catch (error) {
      console.error("Error in validateAndCleanData:", error);
      return data; // Return original data if validation fails
    }
  }

  /**
   * Ensure all price values are strings
   */
  private ensurePriceValuesAreStrings(obj: any): void {
    if (!obj || typeof obj !== "object") return;

    const priceFields = [
      "startPrice",
      "buyItNowPrice",
      "reservePrice",
      "currentPrice",
      "convertedCurrentPrice",
      "buyerGuaranteePrice",
    ];

    priceFields.forEach((field) => {
      if (obj[field] && typeof obj[field] === "object" && obj[field].value !== undefined) {
        obj[field].value = String(obj[field].value);
      }
    });

    // Handle shipping service options
    if (obj.shipping?.shippingServiceOptions) {
      obj.shipping.shippingServiceOptions.forEach((option: any) => {
        if (option.cost && typeof option.cost === "object" && option.cost.value !== undefined) {
          option.cost.value = String(option.cost.value);
        }
        if (
          option.additionalCost &&
          typeof option.additionalCost === "object" &&
          option.additionalCost.value !== undefined
        ) {
          option.additionalCost.value = String(option.additionalCost.value);
        }
      });
    }

    // Handle variations
    if (obj.variations?.variations) {
      obj.variations.variations.forEach((variation: any) => {
        if (
          variation.startPrice &&
          typeof variation.startPrice === "object" &&
          variation.startPrice.value !== undefined
        ) {
          variation.startPrice.value = String(variation.startPrice.value);
        }
      });
    }
  }

  /**
   * Ensure all weight and dimension values are strings
   */
  private ensureWeightDimensionValuesAreStrings(obj: any): void {
    if (!obj || typeof obj !== "object") return;

    // Handle shipping calculated shipping rate
    if (obj.shipping?.calculatedShippingRate) {
      if (obj.shipping.calculatedShippingRate.weightMajor?.value !== undefined) {
        obj.shipping.calculatedShippingRate.weightMajor.value = String(
          obj.shipping.calculatedShippingRate.weightMajor.value
        );
      }
      if (obj.shipping.calculatedShippingRate.weightMinor?.value !== undefined) {
        obj.shipping.calculatedShippingRate.weightMinor.value = String(
          obj.shipping.calculatedShippingRate.weightMinor.value
        );
      }
    }

    // Handle shipping package details
    if (obj.shippingPackageDetails) {
      if (obj.shippingPackageDetails.weightMajor?.value !== undefined) {
        obj.shippingPackageDetails.weightMajor.value = String(obj.shippingPackageDetails.weightMajor.value);
      }
      if (obj.shippingPackageDetails.weightMinor?.value !== undefined) {
        obj.shippingPackageDetails.weightMinor.value = String(obj.shippingPackageDetails.weightMinor.value);
      }
      if (obj.shippingPackageDetails.packageDepth?.value !== undefined) {
        obj.shippingPackageDetails.packageDepth.value = String(obj.shippingPackageDetails.packageDepth.value);
      }
      if (obj.shippingPackageDetails.packageLength?.value !== undefined) {
        obj.shippingPackageDetails.packageLength.value = String(obj.shippingPackageDetails.packageLength.value);
      }
      if (obj.shippingPackageDetails.packageWidth?.value !== undefined) {
        obj.shippingPackageDetails.packageWidth.value = String(obj.shippingPackageDetails.packageWidth.value);
      }
    }
  }

  /**
   * Ensure pictureUrl is always a string, not an array
   */
  private ensurePictureUrlIsString(obj: any): void {
    if (!obj || typeof obj !== "object") return;

    // Handle variations pictures
    if (obj.variations?.pictures?.variationSpecificPictureSets) {
      obj.variations.pictures.variationSpecificPictureSets.forEach((set: any) => {
        if (Array.isArray(set.pictureUrl)) {
          set.pictureUrl = set.pictureUrl[0] || "";
        }
      });
    }
  }

  /**
   * Ensure all numeric fields that should be strings are properly converted
   */
  private ensureNumericFieldsAreStrings(obj: any): void {
    if (!obj || typeof obj !== "object") return;

    // Handle quantity fields
    if (obj.quantity !== undefined) {
      obj.quantity = parseInt(String(obj.quantity)) || 0;
    }

    // Handle bid count
    if (obj.sellingStatus?.bidCount !== undefined) {
      obj.sellingStatus.bidCount = parseInt(String(obj.sellingStatus.bidCount)) || 0;
    }

    // Handle quantity sold
    if (obj.sellingStatus?.quantitySold !== undefined) {
      obj.sellingStatus.quantitySold = parseInt(String(obj.sellingStatus.quantitySold)) || 0;
    }

    // Handle quantity sold by pickup in store
    if (obj.sellingStatus?.quantitySoldByPickupInStore !== undefined) {
      obj.sellingStatus.quantitySoldByPickupInStore =
        parseInt(String(obj.sellingStatus.quantitySoldByPickupInStore)) || 0;
    }

    // Handle feedback score
    if (obj.seller?.feedbackScore !== undefined) {
      obj.seller.feedbackScore = parseInt(String(obj.seller.feedbackScore)) || 0;
    }

    // Handle positive feedback percent
    if (obj.seller?.positiveFeedbackPercent !== undefined) {
      obj.seller.positiveFeedbackPercent = parseFloat(String(obj.seller.positiveFeedbackPercent)) || 0;
    }

    // Handle sales tax percent
    if (obj.shipping?.salesTax?.salesTaxPercent !== undefined) {
      obj.shipping.salesTax.salesTaxPercent = parseFloat(String(obj.shipping.salesTax.salesTaxPercent)) || 0;
    }

    // Handle VAT percent
    if (obj.vatDetails?.vatPercent !== undefined) {
      obj.vatDetails.vatPercent = parseFloat(String(obj.vatDetails.vatPercent)) || 0;
    }

    // Handle dispatch time max
    if (obj.dispatchTimeMax !== undefined) {
      obj.dispatchTimeMax = parseInt(String(obj.dispatchTimeMax)) || 0;
    }

    // Handle variations
    if (obj.variations?.variations) {
      obj.variations.variations.forEach((variation: any) => {
        if (variation.quantity !== undefined) {
          variation.quantity = parseInt(String(variation.quantity)) || 0;
        }
        if (variation.sellingStatus?.quantitySold !== undefined) {
          variation.sellingStatus.quantitySold = parseInt(String(variation.sellingStatus.quantitySold)) || 0;
        }
        if (variation.sellingStatus?.quantitySoldByPickupInStore !== undefined) {
          variation.sellingStatus.quantitySoldByPickupInStore =
            parseInt(String(variation.sellingStatus.quantitySoldByPickupInStore)) || 0;
        }
      });
    }

    // Handle shipping service options
    if (obj.shipping?.shippingServiceOptions) {
      obj.shipping.shippingServiceOptions.forEach((option: any) => {
        if (option.priority !== undefined) {
          option.priority = parseInt(String(option.priority)) || 0;
        }
        if (option.shippingTimeMin !== undefined) {
          option.shippingTimeMin = parseInt(String(option.shippingTimeMin)) || 0;
        }
        if (option.shippingTimeMax !== undefined) {
          option.shippingTimeMax = parseInt(String(option.shippingTimeMax)) || 0;
        }
      });
    }
  }

  /**
   * Check for any remaining object values that should be strings
   */
  private checkForObjectValues(obj: any, path: string = ""): void {
    if (!obj || typeof obj !== "object") return;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        // Check if this looks like it should be a simple value
        if (
          key === "value" &&
          ((value as any).__text !== undefined ||
            (value as any)._currencyID !== undefined ||
            (value as any)._measurementSystem !== undefined)
        ) {
          console.warn(`Found complex object at ${currentPath} that should be simplified:`, value);
        }

        // Recursively check nested objects
        this.checkForObjectValues(value, currentPath);
      }
    }
  }

  /**
   * Convert parsed XML to a clean JSON structure for database storage
   */
  toCleanJson(xmlResponse: IEbayXmlResponse): any {
    try {
      const item = xmlResponse.GetItemResponse?.Item;
      if (!item) {
        throw new Error("No item found in XML response");
      }

      const cleanedData = {
        itemId: item.ItemID,
        title: item.Title,
        listingType: item.ListingType,
        listingDuration: item.ListingDuration,
        quantity: item.Quantity ? parseInt(item.Quantity) || 0 : 0,
        currency: item.Currency,
        country: item.Country,
        postalCode: item.PostalCode,
        location: item.Location,

        // Pricing
        startPrice: this.parsePrice(item.StartPrice),
        buyItNowPrice: this.parsePrice(item.BuyItNowPrice),
        reservePrice: this.parsePrice(item.ReservePrice),
        currentPrice: this.parsePrice(item.SellingStatus?.CurrentPrice),
        convertedCurrentPrice: this.parsePrice(item.SellingStatus?.ConvertedCurrentPrice),

        // Listing details
        listingDetails: {
          startTime: item.ListingDetails?.StartTime,
          endTime: item.ListingDetails?.EndTime,
          viewItemUrl: item.ListingDetails?.ViewItemURL,
          hasUnansweredQuestions: item.ListingDetails?.HasUnansweredQuestions === "true",
          hasPublicMessages: item.ListingDetails?.HasPublicMessages === "true",
          checkoutEnabled: item.ListingDetails?.CheckoutEnabled === "true",
          adult: item.ListingDetails?.Adult === "true",
          bindingAuction: item.ListingDetails?.BindingAuction === "true",
          hasReservePrice: item.ListingDetails?.HasReservePrice === "true",
        },

        // Category
        category: {
          id: item.PrimaryCategory?.CategoryID,
          name: item.PrimaryCategory?.CategoryName,
          path: item.PrimaryCategory?.CategoryName,
        },

        // Condition
        condition: {
          id: item.ConditionID,
          displayName: item.ConditionDisplayName,
        },

        // Seller information
        seller: {
          userId: item.Seller?.UserID,
          email: item.Seller?.Email,
          feedbackScore: item.Seller?.FeedbackScore ? parseInt(item.Seller.FeedbackScore) || 0 : 0,
          positiveFeedbackPercent: item.Seller?.PositiveFeedbackPercent
            ? parseFloat(item.Seller.PositiveFeedbackPercent) || 0
            : 0,
          feedbackPrivate: item.Seller?.FeedbackPrivate === "true",
          idVerified: item.Seller?.IDVerified === "true",
          ebayGoodStanding: item.Seller?.eBayGoodStanding === "true",
          newUser: item.Seller?.NewUser === "true",
          registrationDate: item.Seller?.RegistrationDate,
          site: item.Seller?.Site,
          status: item.Seller?.Status,
          vatStatus: item.Seller?.VATStatus,
          aboutMePage: item.Seller?.AboutMePage === "true",
          motorsDealer: item.Seller?.MotorsDealer === "true",
          sellerInfo: {
            allowPaymentEdit: item.Seller?.SellerInfo?.AllowPaymentEdit === "true",
            checkoutEnabled: item.Seller?.SellerInfo?.CheckoutEnabled === "true",
            cipBankAccountStored: item.Seller?.SellerInfo?.CIPBankAccountStored === "true",
            goodStanding: item.Seller?.SellerInfo?.GoodStanding === "true",
            liveAuctionAuthorized: item.Seller?.SellerInfo?.LiveAuctionAuthorized === "true",
            merchandizingPref: item.Seller?.SellerInfo?.MerchandizingPref,
            qualifiesForB2BVAT: item.Seller?.SellerInfo?.QualifiesForB2BVAT === "true",
            storeOwner: item.Seller?.SellerInfo?.StoreOwner === "true",
            storeUrl: item.Seller?.SellerInfo?.StoreURL,
            safePaymentExempt: item.Seller?.SellerInfo?.SafePaymentExempt === "true",
          },
        },

        // Selling status
        sellingStatus: {
          bidCount: item.SellingStatus?.BidCount ? parseInt(item.SellingStatus.BidCount) || 0 : 0,
          currentPrice: this.parsePrice(item.SellingStatus?.CurrentPrice),
          convertedCurrentPrice: this.parsePrice(item.SellingStatus?.ConvertedCurrentPrice),
          quantitySold: item.SellingStatus?.QuantitySold ? parseInt(item.SellingStatus.QuantitySold) || 0 : 0,
          reserveMet: item.SellingStatus?.ReserveMet === "true",
          secondChanceEligible: item.SellingStatus?.SecondChanceEligible === "true",
          listingStatus: item.SellingStatus?.ListingStatus,
          quantitySoldByPickupInStore: item.SellingStatus?.QuantitySoldByPickupInStore
            ? parseInt(item.SellingStatus.QuantitySoldByPickupInStore) || 0
            : 0,
        },

        // Shipping details
        shipping: {
          applyShippingDiscount: item.ShippingDetails?.ApplyShippingDiscount === "true",
          globalShipping: item.ShippingDetails?.GlobalShipping === "true",
          shippingType: item.ShippingDetails?.ShippingType,
          thirdPartyCheckout: item.ShippingDetails?.ThirdPartyCheckout === "true",
          calculatedShippingRate: {
            weightMajor: this.parseWeight(item.ShippingDetails?.CalculatedShippingRate?.WeightMajor),
            weightMinor: this.parseWeight(item.ShippingDetails?.CalculatedShippingRate?.WeightMinor),
          },
          salesTax: {
            salesTaxPercent: item.ShippingDetails?.SalesTax?.SalesTaxPercent
              ? parseFloat(item.ShippingDetails.SalesTax.SalesTaxPercent) || 0
              : 0,
            shippingIncludedInTax: item.ShippingDetails?.SalesTax?.ShippingIncludedInTax === "true",
          },
          shippingServiceOptions: this.normalizeToArray(item.ShippingDetails?.ShippingServiceOptions).map((option) => ({
            service: option.ShippingService,
            cost: this.parsePrice(option.ShippingServiceCost),
            additionalCost: this.parsePrice(option.ShippingServiceAdditionalCost),
            priority: parseInt(option.ShippingServicePriority) || 0,
            expeditedService: option.ExpeditedService === "true",
            shippingTimeMin: parseInt(option.ShippingTimeMin) || 0,
            shippingTimeMax: parseInt(option.ShippingTimeMax) || 0,
            freeShipping: option.FreeShipping === "true",
          })),
          rateTableDetails: {
            domesticRateTableId: item.ShippingDetails?.RateTableDetails?.DomesticRateTableId,
          },
        },

        // Ship to locations
        shipToLocations: this.normalizeToArray(item.ShipToLocations),

        // Storefront
        storefront: {
          storeCategoryId: item.Storefront?.StoreCategoryID,
          storeCategory2Id: item.Storefront?.StoreCategory2ID,
          storeUrl: item.Storefront?.StoreURL,
        },

        // Pictures
        pictures: {
          galleryType: item.PictureDetails?.GalleryType,
          pictureUrls: this.normalizeToArray(item.PictureDetails?.PictureURL),
        },

        // Business seller details
        businessSellerDetails: item.BusinessSellerDetails
          ? {
              address: {
                street1: item.BusinessSellerDetails.Address?.Street1,
                cityName: item.BusinessSellerDetails.Address?.CityName,
                stateOrProvince: item.BusinessSellerDetails.Address?.StateOrProvince,
                countryName: item.BusinessSellerDetails.Address?.CountryName,
                postalCode: item.BusinessSellerDetails.Address?.PostalCode,
                companyName: item.BusinessSellerDetails.Address?.CompanyName,
                firstName: item.BusinessSellerDetails.Address?.FirstName,
                lastName: item.BusinessSellerDetails.Address?.LastName,
              },
              email: item.BusinessSellerDetails.Email,
              tradeRegistrationNumber: item.BusinessSellerDetails.TradeRegistrationNumber,
              legalInvoice: item.BusinessSellerDetails.LegalInvoice === "true",
            }
          : undefined,

        // Return policy
        returnPolicy: {
          returnsWithinOption: item.ReturnPolicy?.ReturnsWithinOption,
          returnsWithin: item.ReturnPolicy?.ReturnsWithin,
          returnsAcceptedOption: item.ReturnPolicy?.ReturnsAcceptedOption,
          returnsAccepted: item.ReturnPolicy?.ReturnsAccepted,
          shippingCostPaidByOption: item.ReturnPolicy?.ShippingCostPaidByOption,
          shippingCostPaidBy: item.ReturnPolicy?.ShippingCostPaidBy,
          internationalReturnsAcceptedOption: item.ReturnPolicy?.InternationalReturnsAcceptedOption,
          internationalReturnsWithinOption: item.ReturnPolicy?.InternationalReturnsWithinOption,
          internationalShippingCostPaidByOption: item.ReturnPolicy?.InternationalShippingCostPaidByOption,
        },

        // Variations
        variations: item.Variations
          ? {
              variations: this.normalizeToArray(item.Variations.Variation).map((variation) => ({
                startPrice: this.parsePrice(variation.StartPrice),
                quantity: parseInt(variation.Quantity) || 0,
                variationSpecifics: this.parseVariationSpecifics(variation.VariationSpecifics),
                sellingStatus: {
                  quantitySold: parseInt(variation.SellingStatus?.QuantitySold) || 0,
                  quantitySoldByPickupInStore: parseInt(variation.SellingStatus?.QuantitySoldByPickupInStore) || 0,
                },
              })),
              pictures: item.Variations.Pictures
                ? {
                    variationSpecificName: item.Variations.Pictures.VariationSpecificName,
                    variationSpecificPictureSets: this.normalizeToArray(
                      item.Variations.Pictures.VariationSpecificPictureSet
                    ).map((set) => ({
                      variationSpecificValue: set.VariationSpecificValue,
                      pictureUrl: Array.isArray(set.PictureURL) ? set.PictureURL[0] : set.PictureURL,
                    })),
                  }
                : undefined,
              variationSpecificsSet: this.parseVariationSpecificsSet(item.Variations.VariationSpecificsSet),
            }
          : undefined,

        // Regulatory
        regulatory: item.Regulatory
          ? {
              productSafety: {
                pictograms: this.normalizeToArray(item.Regulatory.ProductSafety?.Pictograms?.Pictogram),
                statements: this.normalizeToArray(item.Regulatory.ProductSafety?.Statements?.Statement),
              },
              manufacturer: item.Regulatory.Manufacturer
                ? {
                    companyName: item.Regulatory.Manufacturer.CompanyName,
                    street1: item.Regulatory.Manufacturer.Street1,
                    street2: item.Regulatory.Manufacturer.Street2,
                    cityName: item.Regulatory.Manufacturer.CityName,
                    postalCode: item.Regulatory.Manufacturer.PostalCode,
                    country: item.Regulatory.Manufacturer.Country,
                    phone: item.Regulatory.Manufacturer.Phone,
                    email: item.Regulatory.Manufacturer.Email,
                  }
                : undefined,
              responsiblePersons: item.Regulatory.ResponsiblePersons
                ? {
                    responsiblePersons: this.normalizeToArray(item.Regulatory.ResponsiblePersons.ResponsiblePerson).map(
                      (person) => ({
                        companyName: person.CompanyName,
                        street1: person.Street1,
                        street2: person.Street2,
                        cityName: person.CityName,
                        postalCode: person.PostalCode,
                        country: person.Country,
                        phone: person.Phone,
                        email: person.Email,
                        types: this.normalizeToArray(person.Types?.Type),
                      })
                    ),
                  }
                : undefined,
            }
          : undefined,

        // Seller profiles
        sellerProfiles: item.SellerProfiles
          ? {
              shippingProfile: {
                id: item.SellerProfiles.SellerShippingProfile?.ShippingProfileID,
                name: item.SellerProfiles.SellerShippingProfile?.ShippingProfileName,
              },
              returnProfile: {
                id: item.SellerProfiles.SellerReturnProfile?.ReturnProfileID,
                name: item.SellerProfiles.SellerReturnProfile?.ReturnProfileName,
              },
              paymentProfile: {
                id: item.SellerProfiles.SellerPaymentProfile?.PaymentProfileID,
                name: item.SellerProfiles.SellerPaymentProfile?.PaymentProfileName,
              },
            }
          : undefined,

        // Shipping package details
        shippingPackageDetails: item.ShippingPackageDetails
          ? {
              packageDepth: this.parseDimension(item.ShippingPackageDetails.PackageDepth),
              packageLength: this.parseDimension(item.ShippingPackageDetails.PackageLength),
              packageWidth: this.parseDimension(item.ShippingPackageDetails.PackageWidth),
              shippingIrregular: item.ShippingPackageDetails.ShippingIrregular === "true",
              shippingPackage: item.ShippingPackageDetails.ShippingPackage,
              weightMajor: this.parseWeight(item.ShippingPackageDetails.WeightMajor),
              weightMinor: this.parseWeight(item.ShippingPackageDetails.WeightMinor),
            }
          : undefined,

        // Other fields
        autoPay: item.AutoPay === "true",
        buyerProtection: item.BuyerProtection,
        buyerResponsibleForShipping: item.BuyerResponsibleForShipping === "true",
        dispatchTimeMax: item.DispatchTimeMax ? parseInt(item.DispatchTimeMax) || 0 : 0,
        proxyItem: item.ProxyItem === "true",
        buyerGuaranteePrice: this.parsePrice(item.BuyerGuaranteePrice),
        intangibleItem: item.IntangibleItem === "true",
        relistParentId: item.RelistParentID,
        hideFromSearch: item.HideFromSearch === "true",
        outOfStockControl: item.OutOfStockControl === "true",
        pickupInStoreDetails: item.PickupInStoreDetails
          ? {
              availableForPickupInStore: item.PickupInStoreDetails.AvailableForPickupInStore === "true",
            }
          : undefined,
        ebayPlus: item.eBayPlus === "true",
        ebayPlusEligible: item.eBayPlusEligible === "true",
        isSecureDescription: item.IsSecureDescription === "true",

        // VAT details
        vatDetails: item.VATDetails
          ? {
              vatPercent: item.VATDetails.VATPercent ? parseFloat(item.VATDetails.VATPercent) || 0 : 0,
            }
          : undefined,

        // Time left
        timeLeft: item.TimeLeft,

        // Metadata
        metadata: {
          timestamp: xmlResponse.GetItemResponse?.Timestamp,
          ack: xmlResponse.GetItemResponse?.Ack,
          version: xmlResponse.GetItemResponse?.Version,
          build: xmlResponse.GetItemResponse?.Build,
        },
      };

      // Validate and clean the data before returning
      return this.validateAndCleanData(cleanedData);
    } catch (error) {
      console.error("Error in toCleanJson:", error);
      throw new Error(`Failed to convert XML to clean JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parsePrice(priceObj: any): any {
    if (!priceObj) return undefined;

    // Handle complex objects with __text property
    let value: string;
    if (typeof priceObj === "object" && priceObj !== null) {
      if (priceObj.__text !== undefined) {
        value = String(priceObj.__text);
      } else if (typeof priceObj === "object") {
        // If it's an object without __text, try to extract meaningful value
        value =
          Object.values(priceObj)
            .find((v) => v !== undefined && v !== null)
            ?.toString() || "0";
      } else {
        value = "0";
      }
    } else {
      value = String(priceObj);
    }

    return {
      value: value,
      currency: priceObj._currencyID || "USD",
    };
  }

  private parseWeight(weightObj: any): any {
    if (!weightObj) return undefined;

    // Handle complex objects with __text property
    let value: string;
    if (typeof weightObj === "object" && weightObj !== null) {
      if (weightObj.__text !== undefined) {
        value = String(weightObj.__text);
      } else if (typeof weightObj === "object") {
        // If it's an object without __text, try to extract meaningful value
        value =
          Object.values(weightObj)
            .find((v) => v !== undefined && v !== null)
            ?.toString() || "0";
      } else {
        value = "0";
      }
    } else {
      value = String(weightObj);
    }

    return {
      value: value,
      measurementSystem: weightObj._measurementSystem || "Metric",
      unit: weightObj._unit || "kg",
    };
  }

  private parseDimension(dimensionObj: any): any {
    if (!dimensionObj) return undefined;

    // Handle complex objects with __text property
    let value: string;
    if (typeof dimensionObj === "object" && dimensionObj !== null) {
      if (dimensionObj.__text !== undefined) {
        value = String(dimensionObj.__text);
      } else if (typeof dimensionObj === "object") {
        // If it's an object without __text, try to extract meaningful value
        value =
          Object.values(dimensionObj)
            .find((v) => v !== undefined && v !== null)
            ?.toString() || "0";
      } else {
        value = "0";
      }
    } else {
      value = String(dimensionObj);
    }

    return {
      value: value,
      measurementSystem: dimensionObj._measurementSystem || "Metric",
      unit: dimensionObj._unit || "cm",
    };
  }

  private parseVariationSpecifics(specificsObj: any): any {
    try {
      if (!specificsObj) return undefined;

      const nameValueLists = this.normalizeToArray(specificsObj.NameValueList);
      const result: any = {};

      nameValueLists.forEach((list: any) => {
        if (list && list.Name && list.Value !== undefined) {
          result[list.Name] = this.normalizeToArray(list.Value);
        }
      });

      return result;
    } catch (error) {
      console.error("Error in parseVariationSpecifics:", error);
      return undefined;
    }
  }

  private parseVariationSpecificsSet(specificsSetObj: any): any {
    try {
      if (!specificsSetObj) return undefined;

      const nameValueLists = this.normalizeToArray(specificsSetObj.NameValueList);
      const result: any = {};

      nameValueLists.forEach((list: any) => {
        if (list && list.Name && list.Value !== undefined) {
          result[list.Name] = this.normalizeToArray(list.Value);
        }
      });

      return result;
    } catch (error) {
      console.error("Error in parseVariationSpecificsSet:", error);
      return undefined;
    }
  }

  private normalizeToArray(value: any): any[] {
    try {
      if (value === undefined || value === null) return [];
      if (Array.isArray(value)) return value;
      return [value];
    } catch (error) {
      console.error("Error in normalizeToArray:", error);
      return [];
    }
  }
}

export default EbayXmlParser;
