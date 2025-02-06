import fs from "fs";
import Papa from "papaparse";
import mongoose from "mongoose";
import { Product } from "@/models"; // Adjust based on the actual file path

/**
 * Validate CSV Data based on Product Schema
 * @param {string} filePath - Path to the CSV file.
 * @returns {object} - Validation result with valid and invalid rows.
 */
const validateCsvData = (filePath: string) => {
  const requiredColumns = [
    //productInfo
    "title",
    "brand",
    "productDescription",
    "productCategory",
    "productSupplier",
    "kind",
    //prodMedia
    "images",
    "videos",
    //prodTechInfo
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
    "memory",
    "maxRamCapacity",
    "unitType",
    "unitQuantity",
    "mpn",
    "processorSpeed",
    "ramSize",
    "formFactor",
    "ean",
    "productType",
    "manufacturerWarranty",
    "regionOfManufacture",
    "height",
    "length",
    "width",
    "weight",
    "nonNewConditionDetails",
    "productCondition",
    "numberOfLANPorts",
    "maximumWirelessData",
    "maximumLANDataRate",
    "ports",
    "toFit",
    "displayType",
    "aspectRatio",
    "imageBrightness",
    "throwRatio",
    "compatibleOperatingSystem",
    "compatibleFormat",
    "lensMagnification",
    "yearManufactured",
    "nativeResolution",
    "displayTechnology",
    "energyEfficiencyRating",
    "videoInputs",
    "refreshRate",
    "responseTime",
    "brightness",
    "contrastRatio",
    "ecRange",
    "productLine",
    "customBundle",
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
    "deviceConnectivity",
    "connectorType",
    "supportedWirelessProtocol",
    // amazon specific fields
    "recommendedBrowseNotes",
    "bulletPoint",
    "powerPlug",
    "graphicsCardInterface",
    "ramMemoryMaximumSize",
    "ramMemoryMaximumSizeUnit",
    "ramMemoryTechnology",
    "humanInterfaceInput",
    "includedComponents",
    "specificUsesForProduct",
    "cacheMemoryInstalledSize",
    "cacheMemoryInstalledSizeUnit",
    "cpuModel",
    "cpuModelManufacturer",
    "cpuModelNumber",
    "cpuSocket",
    "cpuBaseSpeed",
    "cpuBaseSpeedUnit",
    "graphicsRam",
    "hardDiskDescription",
    "hardDiskInterface",
    "hardDiskRotationalSpeed",
    "hardDiskRotationalSpeedUnit",
    "totalUsb2oPorts",
    "totalUsb3oPorts",
    "productWarranty",
    "gdprRisk",
    "opticalStorageDevice",
    "dangerousGoodsRegulation",
    "safetyAndCompliance",
    "manufacturer",
    //prodPricing
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
    //prodDelivery
    "postagePolicy",
    "packageWeight",
    "packageDimensions",
    "irregularPackage",
    //prodSeo
    "seoTags",
    "relevantTags",
    "suggestedTags",
  ];

  // Read CSV file content
  const fileContent = fs.readFileSync(filePath, "utf8");
  const parsedData = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsedData.errors.length > 0) {
    throw new Error(`CSV Parsing Errors: ${JSON.stringify(parsedData.errors)}`);
  }

  const validRows: { row: number; data: any }[] = [];
  const invalidRows: { row: number; errors: string[] }[] = [];

  parsedData.data.forEach((row: any, index: number) => {
    const errors: string[] = [];

    // ✅ Check for missing required columns
    requiredColumns.forEach((col) => {
      if (!row[col]?.trim()) {
        errors.push(`${col} is missing or empty`);
      }
    });

    // ✅ Validate 'Price' - should be a number
    if (row.price && !Number.isFinite(parseFloat(row.price))) {
      errors.push("Price must be a valid number");
    }

    // ✅ Validate 'Stock' - should be an integer
    if (row.stock && !Number.isInteger(Number(row.stock))) {
      errors.push("Stock must be a valid integer");
    }

    // ✅ Validate 'SupplierId' - should be a valid MongoDB ObjectId
    if (row.supplierId && !mongoose.isValidObjectId(row.supplierId)) {
      errors.push("SupplierId must be a valid MongoDB ObjectId");
    }

    // ✅ Validate JSON fields
    ["AmazonInfo", "EbayInfo", "WebsiteInfo"].forEach((field) => {
      if (row[field]) {
        try {
          JSON.parse(row[field]);
        } catch {
          errors.push(`${field} must be valid JSON`);
        }
      }
    });

    // ✅ Store results
    if (errors.length > 0) {
      invalidRows.push({ row: index + 1, errors });
    } else {
      validRows.push({ row: index + 1, data: row });
    }
  });

  return { validRows, invalidRows };
};

/**
 * Perform the bulk import after validation
 * @param {string} filePath - The path to the CSV file.
 * @returns {void}
 */
const bulkImportProducts = async (filePath: string): Promise<void> => {
  try {
    const { validRows, invalidRows } = validateCsvData(filePath);

    if (invalidRows.length > 0) {
      console.log("❌ Some rows are invalid. Please fix the following errors:");
      invalidRows.forEach((invalid) => {
        console.log(`Row ${invalid.row}: ${invalid.errors.join(", ")}`);
      });
      return;
    }

    // ✅ Optimize by using bulk insert (`insertMany`)
    const bulkProducts = validRows.map(({ data }) => ({
      title: data.title,
      brand: data.brand,
      description: data.productDescription,
      category: data.productCategory,
      price: parseFloat(data.price),
      stock: parseInt(data.stock, 10),
      supplier: new mongoose.Types.ObjectId(data.supplierId || undefined),
      media: {
        images: data.images?.split(","),
        videos: data.videos?.split(","),
      },
      technicalInfo: {
        processor: data.processor,
        model: data.model,
        os: data.operatingSystem,
        storage: data.storageType,
        ramSize: data.ramSize,
        gpu: data.graphicsProcessingType,
        screenSize: data.screenSize,
      },
      platformDetails: {
        amazon: {
          productInfo: data.AmazonInfo ? JSON.parse(data.AmazonInfo) : {},
        },
        ebay: { productInfo: data.EbayInfo ? JSON.parse(data.EbayInfo) : {} },
        website: {
          productInfo: data.WebsiteInfo ? JSON.parse(data.WebsiteInfo) : {},
        },
      },
    }));

    await Product.insertMany(bulkProducts);
    console.log("✅ Bulk import completed successfully.");
  } catch (error) {
    console.error("❌ Bulk import failed:", error);
  }
};

export { bulkImportProducts, validateCsvData };
