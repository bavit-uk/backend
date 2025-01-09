export function transformProductData(data: any) {
  // Initialize the result object
  const result: any = {
    stepData: {
      productInfo: {},
      prodTechInfo: {},
      prodPricing: {},
      prodDelivery: {},
      prodSeo: {},
    },
  };

  // Helper function to create the common structure
  const createField = (name: string, value: any, platformData: any) => ({
    name,
    value,
    isEbay: !!platformData.ebay?.[name],
    isAmz: !!platformData.amazon?.[name],
    isWeb: !!platformData.website?.[name],
  });

  // Transform `productInfo` fields
  const productInfoFields = [
    "brand",
    "title",
    "productDescription",
    "productCategory",
    "images",
  ];
  productInfoFields.forEach((field) => {
    const value =
      data.platformDetails.amazon?.productInfo?.[field] ||
      data.platformDetails.ebay?.productInfo?.[field] ||
      data.platformDetails.website?.productInfo?.[field] ||
      null;

    if (value !== null) {
      result.stepData.productInfo[field] = createField(field, value, {
        amazon: data.platformDetails.amazon?.productInfo,
        ebay: data.platformDetails.ebay?.productInfo,
        website: data.platformDetails.website?.productInfo,
      });
    }
  });

  // Transform `prodTechInfo` fields
  const prodTechInfoFields = [
    "processor",
    "model",
    "operatingSystem",
    "storageType",
    "features",
    "ssdCapacity",
    "gpu",
    "type",
    "releaseYear",
    "hardDriveCapacity",
    "color",
    "maxResolution",
    "mostSuitableFor",
    "screenSize",
    "graphicsProcessingType",
    "connectivity",
    "motherboardModel",
    "series",
    "operatingSystemEdition",

    " memory",
    " maxRamCapacity",
    " unitType",
    " unitQuantity",
    " mpn",
    " processorSpeed",
    " ramSize",
    " formFactor",

    " ean",

    " productType",

    " manufacturerWarranty",
    " regionOfManufacture",
    " height",
    " length",
    " width",

    " numberOfLANPorts",
    " maximumWirelessData",
    " maximumLANDataRate",
    " ports",
    " toFit",

    " aspectRatio",

    " energyEfficiencyRating",
    " videoInputs",
    " refreshRate",
    " responseType",
    " brightness",
    " contrastRatio",
    " ecRange",
    " productLine",

    " customBundle",

    " interface",
    " networkConnectivity",
    " networkManagementType",
    " networkType",
    " processorManufacturer",
    " numberOfProcessors",
    " numberOfVANPorts",
    " processorType",
    " raidLevel",
    " memoryType",

    " deviceConnectivity",
    " connectorType",
    " supportedWirelessProtocol",
  ];
  prodTechInfoFields.forEach((field) => {
    const value =
      data.platformDetails.amazon?.prodTechInfo?.[field] ||
      data.platformDetails.ebay?.prodTechInfo?.[field] ||
      data.platformDetails.website?.prodTechInfo?.[field] ||
      null;

    if (value !== null) {
      result.stepData.prodTechInfo[field] = createField(field, value, {
        amazon: data.platformDetails.amazon?.prodTechInfo,
        ebay: data.platformDetails.ebay?.prodTechInfo,
        website: data.platformDetails.website?.prodTechInfo,
      });
    }
  });

  // Transform `prodPricing`
  const prodPricingFields = [
    "quantity",
    "price",
    "condition",
    "conditionDescription",
    "pricingFormat",
    "vat",
    "paymentPolicy",
    "buy2andSave",
    "buy3andSave",
    "buy4andSave",
  ];
  prodPricingFields.forEach((field) => {
    const value =
      data.platformDetails.amazon?.prodPricing?.[field] ||
      data.platformDetails.ebay?.prodPricing?.[field] ||
      data.platformDetails.website?.prodPricing?.[field] ||
      null;

    if (value !== null) {
      result.stepData.prodPricing[field] = createField(field, value, {
        amazon: data.platformDetails.amazon?.prodPricing,
        ebay: data.platformDetails.ebay?.prodPricing,
        website: data.platformDetails.website?.prodPricing,
      });
    }
  });

  // Transform `prodDelivery`
  const prodDeliveryFields = [
    "postagePolicy",
    "packageWeight",
    "packageDimensions",
    "irregularPackage",
  ];
  prodDeliveryFields.forEach((field) => {
    const value =
      data.platformDetails.amazon?.prodDelivery?.[field] ||
      data.platformDetails.ebay?.prodDelivery?.[field] ||
      data.platformDetails.website?.prodDelivery?.[field] ||
      null;

    if (value !== null) {
      result.stepData.prodDelivery[field] = createField(field, value, {
        amazon: data.platformDetails.amazon?.prodDelivery,
        ebay: data.platformDetails.ebay?.prodDelivery,
        website: data.platformDetails.website?.prodDelivery,
      });
    }
  });

  // Transform `prodSeo`
  const prodSeoFields = ["seoTags", "relevantTags", "suggestedTags"];
  prodSeoFields.forEach((field) => {
    const value =
      data.platformDetails.amazon?.prodSeo?.[field] ||
      data.platformDetails.ebay?.prodSeo?.[field] ||
      data.platformDetails.website?.prodSeo?.[field] ||
      null;

    if (value !== null) {
      result.stepData.prodSeo[field] = createField(field, value, {
        amazon: data.platformDetails.amazon?.prodSeo,
        ebay: data.platformDetails.ebay?.prodSeo,
        website: data.platformDetails.website?.prodSeo,
      });
    }
  });

  return result;
}
