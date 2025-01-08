export function transformProductData(data: any) {
  // Initialize the result object
  const result: any = {
    stepData: {
      productCategory:
        data.platformDetails.amazon.productCategory?.$oid || null,
    },
  };

  // Helper function to create the common structure
  const createField = (name: string, value: any) => {
    return {
      name: name,
      value: value,
      isEbay: !!data.platformDetails.ebay?.[name],
      isAmz: !!data.platformDetails.amazon?.[name],
      isWeb: !!data.platformDetails.website?.[name],
    };
  };

  // List of all fields from the schema
  const fieldsToTransform = [
    "title",
    "brand",
    "screenSize",
    "productCondition",
    "nonNewConditionDetails",
    "images",
    "processor",
    "model",
    "operatingSystem",
    "storageType",
    "features",
    "ssdCapacity",
    "gpu",
    "maxRamCapacity",
    "unitQuantity",
    "unitType",
    "productLine",
    "mpn",
    "type",
    "ramSize",
    "formFactor",
    "ean",
    "manufacturerWarranty",
    "regionOfManufacture",
    "interface",
    "networkConnectivity",
    "networkManagementType",
    "networkType",
    "processorManufacturer",
    "numberOfProcessors",
    "numberOfVANPorts",
    "processorType",
    "raidLevel",
    "memoryType",
    "processorSpeed",
    "deviceConnectivity",
    "connectorType",
    "supportedWirelessProtocol",
    "releaseYear",
    "hardDriveCapacity",
    "color",
    "maxResolution",
    "mostSuitableFor",
    "graphicsProcessingType",
    "motherboardModel",
    "series",
    "customBundle",
    "aspectRatio",
    "energyEfficiencyRating",
    "videoInputs",
    "refreshRate",
    "responseType",
    "brightness",
    "contrastRatio",
    "ecRange",
    "numberOfLANPorts",
    "maximumWirelessData",
    "maximumLANDataRate",
    "ports",
    "toFit",
    "memory",
    "operatingSystemEdition",
    "productType",
    "All In One PC",
    "connectivity",
    "height",
    "length",
    "weight",
    "width",
    "condition",
    "conditionDescription",
    "productDescription",
    "pricingFormat",
    "vat",
    "paymentPolicy",
    "buy2andSave",
    "buy3andSave",
    "buy4andSave",
    "shipping",
    "seoTags",
    "relevantTags",
    "suggestedTags",
    "postagePolicy",
    "packageWeight",
    "packageDimensions",
    "irregularPackage",
    "fulfillmentMethod",
    "identifier",
    "vatPercentage",
    "salesTaxPercentage",
    "applyTaxAtCheckout",
    "taxConfirmation",
  ];

  // Transform each field dynamically
  fieldsToTransform.forEach((field) => {
    const value =
      data.platformDetails.amazon?.[field] ||
      data.platformDetails.ebay?.[field] ||
      data.platformDetails.website?.[field] ||
      null; // Default to null if field is not present

    if (value !== null) {
      result.stepData[field] = createField(field, value);
    }
  });

  // Remove null fields from the productCategory as well
  if (!result.stepData.productCategory) {
    delete result.stepData.productCategory;
  }

  return result;
}
