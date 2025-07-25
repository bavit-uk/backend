import { Inventory, ProductCategory, Stock, User } from "@/models"; //getInventoryByCondition
import { Parser } from "json2csv";
import mongoose from "mongoose";
import crypto from "crypto";
import { addLog } from "@/utils/bulkImportLogs.util";
import { getCache, setCacheWithTTL } from "@/datasources/redis.datasource";
import fs from "fs";
import * as XLSX from "xlsx";
// Utility function to pick allowed fields
function pick(obj: any, keys: string[]) {
  return keys.reduce((acc: { [key: string]: any }, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});
}

interface ExportParams {
  inventoryIds: string[];
  selectAllPages: boolean;
  // filters: {
  //   category?: string;
  //   search?: string;
  //   // Add other filter properties as needed
  //   [key: string]: any;
  // };
}

interface ExportResult {
  fromCache: boolean;
  file: string;
  totalExported: number;
}

export const inventoryService = {
  // Create a new draft inventory
  createDraftInventoryService: async (stepData: any) => {
    console.log("stepData:", stepData);
    try {
      if (!stepData || typeof stepData !== "object") {
        throw new Error("Invalid or missing 'stepData'");
      }

      if (!stepData.productInfo || typeof stepData.productInfo !== "object") {
        throw new Error("Invalid or missing 'productInfo' in stepData");
      }

      // ✅ Extract `isPart` from stepData (NOT from productInfo)
      const isPart = stepData.isPart === true || stepData.isPart === "true"; // Ensure it's a boolean
      const isMultiBrand = stepData.isMultiBrand === true || stepData.isMultiBrand === "true"; // Ensure it's a boolean
      const status = stepData.status || "draft"; // Default to 'draft' if not provided
      const {
        kind,
        item_name,
        product_description,
        brand,
        productCategory,
        inventoryImages,
        condition_type,
        ebayCategoryId,
        amazonCategoryId,
      } = stepData.productInfo;

      if (!kind || !Inventory.discriminators || !Inventory.discriminators[kind]) {
        throw new Error(`Invalid or missing discriminator for kind: ${kind}`);
      }

      let categoryId;

      // Handle productCategory based on isPart
      if (isPart) {
        // For parts, accept eBay category ID (string or number)
        if (productCategory === undefined || productCategory === null || productCategory === "") {
          throw new Error("Invalid or missing 'productCategory' for part");
        }
        categoryId = productCategory.toString(); // Convert to string
      } else {
        // For non-parts, validate as MongoDB ObjectId
        if (!mongoose.isValidObjectId(productCategory)) {
          throw new Error("Invalid or missing 'productCategory' for product");
        }
        categoryId = new mongoose.Types.ObjectId(productCategory);
      }

      if (!categoryId) throw new Error("Invalid or missing 'productCategory'");
      // if (!supplierId) throw new Error("Invalid or missing 'productSupplier'");

      // ✅ Ensure inventoryImages is correctly mapped inside productInfo
      const productInfo = {
        kind,
        productCategory: categoryId,
        // productSupplier: supplierId,

        item_name: item_name || [],
        product_description: product_description || [],
        brand: brand || [],
        amazonCategoryId: amazonCategoryId || "",
        condition_type: condition_type || "",
        ebayCategoryId: ebayCategoryId || "",
        inventoryImages: Array.isArray(inventoryImages) ? inventoryImages : [],
      };

      const draftInventoryData: any = {
        status,
        isBlocked: false,
        kind,
        isPart, // ✅ Now correctly storing `isPart`
        productInfo,
        // isTemplate,
        // isVariation,
        isMultiBrand,
        prodPricing: stepData.prodPricing || {},
        prodTechInfo: stepData.prodTechInfo || {},
        prodDelivery: stepData.prodDelivery || {},
        prodSeo: stepData.prodSeo || {},
      };

      console.log("draftInventoryData before cleaning:", draftInventoryData);

      Object.keys(draftInventoryData).forEach((key) => {
        if (typeof draftInventoryData[key] === "object" && draftInventoryData[key]) {
          Object.keys(draftInventoryData[key]).forEach((subKey) => {
            if (draftInventoryData[key][subKey] === undefined) {
              delete draftInventoryData[key][subKey];
            }
          });
        }
      });

      console.log("Final draftInventoryData before saving:", draftInventoryData);

      const draftInventory = new Inventory.discriminators[kind](draftInventoryData);
      await draftInventory.save({ validateBeforeSave: false });

      return draftInventory;
    } catch (error: any) {
      console.error("Error creating draft inventory:", error);
      throw new Error(error.message || "Failed to create draft inventory");
    }
  },

  // Update an existing draft inventory when user move to next stepper
  updateDraftInventory: async (inventoryId: string, stepData: any) => {
    try {
      // console.log("Received update request:", { inventoryId, stepData });

      // Validate inventoryId
      if (!mongoose.isValidObjectId(inventoryId)) {
        throw new Error("Invalid inventory ID");
      }

      // Find inventory
      const draftInventory: any = await Inventory.findById(inventoryId);
      if (!draftInventory) {
        console.error("Draft inventory not found:", inventoryId);
        throw new Error("Draft inventory not found");
      }

      console.log("Existing inventory before update:", JSON.stringify(draftInventory, null, 2));

      // Update Status & Template Check
      if (stepData.status !== undefined) {
        draftInventory.status = stepData.status;
        draftInventory.isTemplate = stepData.isTemplate || false;
        draftInventory.alias = stepData.alias || "";
      }

      // if (draftInventory.isPart) {
      // For parts, we need to handle the different technical info structure
      if (stepData.prodTechInfo) {
        draftInventory.prodTechInfo = stepData.prodTechInfo;
        draftInventory.markModified("prodTechInfo");
      } else {
        // Update Nested Sections Dynamically
        const sectionsToUpdate = ["productInfo"];
        sectionsToUpdate.forEach((section) => {
          if (stepData[section]) {
            console.log(`Updating ${section} with:`, stepData[section]);
            draftInventory[section] = {
              ...(draftInventory[section] || {}), // Preserve existing data
              ...stepData[section], // Merge new data
            };
            draftInventory.markModified(section);
          }
        });
      }
      // } else {
      // Update Nested Sections Dynamically
      // const sectionsToUpdate = ["productInfo", "prodPricing", "prodDelivery", "prodSeo", "prodMedia", "prodTechInfo"];
      // sectionsToUpdate.forEach((section) => {
      //   if (stepData[section]) {
      //     console.log(`Updating ${section} with:`, stepData[section]);
      //     draftInventory[section] = {
      //       ...(draftInventory[section] || {}), // Preserve existing data
      //       ...stepData[section], // Merge new data
      //     };
      //     draftInventory.markModified(section);
      //   }
      // });
      // }

      // Update Top-Level Fields
      const topLevelFields = [
        "publishToEbay",
        "publishToAmazon",
        "publishToWebsite",
        "stockThreshold",
        "isBlocked",
        "kind",
        "stocks",
        "stockThreshold",
        "isTemplate",
        "alias",
        "isVariation",
        "isMultiBrand",
        "status",
      ];
      topLevelFields.forEach((field) => {
        if (stepData[field] !== undefined) {
          draftInventory[field] = stepData[field];
        }
      });

      console.log("Final inventory object before save:", JSON.stringify(draftInventory, null, 2));

      // Save updated inventory
      await draftInventory.save({ validateBeforeSave: false });

      // console.log("Updated inventory after save:", JSON.stringify(draftInventory, null, 2));

      return draftInventory;
    } catch (error: any) {
      console.error("Error updating draft inventory:", error);
      throw new Error(`Failed to update draft inventory: ${error.message}`);
    }
  },

  getInventoriesWithStock: async () => {
    try {
      // ✅ Step 1: Get unique inventory IDs from Stock where `markAsStock` is true
      const stockInventories = await Stock.distinct("inventoryId", {
        markAsStock: true,
      });

      if (!stockInventories.length) {
        return [];
      }

      // ✅ Step 2: Find Inventories that match the stock inventory IDs
      const inventories = await Inventory.find({
        _id: { $in: stockInventories },
      }).lean();

      return inventories;
    } catch (error) {
      console.error("❌ Error retrieving inventories with stock:", error);
      throw new Error("Failed to fetch inventories with stock");
    }
  },

  getFullInventoryById: async (id: string) => {
    try {
      const inventory = await Inventory.findById(id).populate("productInfo.productCategory");
      // .populate("productInfo.productSupplier");
      // .lean();

      if (!inventory) throw new Error("Inventory not found");
      return inventory;
    } catch (error) {
      console.error(`Error fetching full inventory by ID: ${id}`, error);
      throw new Error("Failed to fetch full inventory");
    }
  },

  getAllInventory: async () => {
    try {
      return await Inventory.find()
        .populate("productInfo.productCategory")
        // .populate("productInfo.productSupplier")
        .populate("prodPricing.paymentPolicy");
    } catch (error) {
      console.error("Error fetching all inventory:", error);
      throw new Error("Failed to fetch inventory");
    }
  },

  //getting all template inventory name and their id
  // getInventoryByCondition: async (condition: Record<string, any>) => {
  //   try {
  //     return await Inventory.find(condition)
  //       .populate("productInfo.productCategory.name")
  //       // .populate("productInfo.productSupplier")
  //       .select("_id kind prodTechInfo brand model alias srno productCategory productInfo") // ✅ Explicitly include prodTechInfo
  //       .lean(); // ✅ Converts Mongoose document to plain object (avoids type issues)
  //   } catch (error) {
  //     console.error("Error fetching inventory by condition:", error);
  //     throw new Error("Failed to fetch inventory by condition");
  //   }
  // },

  getInventoryByCondition: async (condition: Record<string, any>) => {
    try {
      return await Inventory.find(condition)
        .populate({
          path: "productInfo.productCategory",
          select: "name ebayCategoryId amazonCategoryId", // Add other fields you need
        })
        .select("_id kind prodTechInfo brand model alias srno productInfo")
        .lean();
    } catch (error) {
      console.error("Error fetching inventory by condition:", error);
      throw new Error("Failed to fetch inventory by condition");
    }
  },
  getInventoryById: async (id: string) => {
    try {
      const inventory = await Inventory.findById(id)
        .populate("productInfo.productCategory")
        // .populate("productInfo.productSupplier")
        .populate("prodPricing.paymentPolicy");
      if (!inventory) throw new Error("Inventory not found");
      return inventory;
    } catch (error) {
      // console.error(`Error fetching inventory by ID for platform ${platform}:`, error);
      console.error(`Error fetching inventory`, error);
      throw new Error("Failed to fetch inventory");
    }
  },

  updateInventory: async (id: string, data: any) => {
    try {
      const updateQuery = { [`platformDetails.`]: data };
      const updatedInventory = await Inventory.findByIdAndUpdate(id, updateQuery, { new: true });
      if (!updatedInventory) throw new Error("Inventory not found");
      return updatedInventory;
    } catch (error) {
      console.error(`Error updating inventory`, error);
      throw new Error("Failed to update inventory");
    }
  },

  deleteInventory: (id: string) => {
    const inventory = Inventory.findByIdAndDelete(id);
    if (!inventory) {
      throw new Error("Category not found");
    }
    return inventory;
  },

  toggleBlock: async (id: string, isBlocked: boolean) => {
    try {
      const updatedInventory = await Inventory.findByIdAndUpdate(id, { isBlocked }, { new: true });
      if (!updatedInventory) throw new Error("Inventory not found");
      return updatedInventory;
    } catch (error) {
      console.error("Error toggling block status:", error);
      throw new Error("Failed to toggle block status");
    }
  },

  toggleIsTemplate: async (id: string, isTemplate: boolean) => {
    try {
      const updatedInventory = await Inventory.findByIdAndUpdate(id, { isTemplate }, { new: true });
      if (!updatedInventory) throw new Error("Inventory not found");
      return updatedInventory;
    } catch (error) {
      console.error("Error toggling template status:", error);
      throw new Error("Failed to toggle template status");
    }
  },

  // New API for fetching inventory stats (separate service logic)
  getInventoryStats: async () => {
    try {
      const totalInventory = await Inventory.countDocuments({});
      const activeInventory = await Inventory.countDocuments({
        isBlocked: false,
      });
      const blockedInventory = await Inventory.countDocuments({
        isBlocked: true,
      });
      const PublishedInventory = await Inventory.countDocuments({
        status: "published",
      });
      const DraftInventory = await Inventory.countDocuments({
        status: "draft",
      });
      const TemplateInventory = await Inventory.countDocuments({
        isTemplate: true,
      });

      return {
        totalInventory,
        activeInventory,
        blockedInventory,
        PublishedInventory,
        DraftInventory,
        TemplateInventory,
      };
    } catch (error) {
      console.error("Error fetching Inventory stats:", error);
      throw new Error("Error fetching inventory statistics");
    }
  },

  searchAndFilterInventory: async (filters: any) => {
    try {
      const {
        searchQuery = "",
        isBlocked,
        isTemplate,
        productCategory,
        kind,
        status, // Extract status from filters
        startDate,
        endDate,
        isPart,
        page = 1, // Default to page 1 if not provided
        limit = 10, // Default to 10 records per page
      } = filters;

      // Convert page and limit to numbers safely
      const pageNumber = Math.max(parseInt(page, 10) || 1, 1); // Ensure minimum page is 1
      const limitNumber = parseInt(limit, 10) || 10;
      const skip = (pageNumber - 1) * limitNumber;

      const query: any = {};
      const andConditions: any[] = [];

      // 🔎 Search logic
      if (searchQuery) {
        const searchConditions: any[] = [
          { "productInfo.item_name.value": { $regex: searchQuery, $options: "i" } },
          { "productInfo.brand.value": { $regex: searchQuery, $options: "i" } },
          { "prodPricing.condition": { $regex: searchQuery, $options: "i" } },
        ];

        const [users, productCategories] = await Promise.all([
          User.find({
            $or: [
              { firstName: { $regex: searchQuery, $options: "i" } },
              { lastName: { $regex: searchQuery, $options: "i" } },
              { email: { $regex: searchQuery, $options: "i" } },
            ],
          }).select("_id"),

          ProductCategory.find({
            name: { $regex: searchQuery, $options: "i" },
          }).select("_id"),
        ]);

        if (productCategories.length > 0) {
          searchConditions.push({
            "productInfo.productCategory": {
              $in: productCategories.map((cat) => cat._id),
            },
          });
        }

        andConditions.push({ $or: searchConditions });
      }

      // 🟢 Category filter (from query param)
      if (filters.productCategory && mongoose.Types.ObjectId.isValid(filters.productCategory)) {
        andConditions.push({
          "productInfo.productCategory": new mongoose.Types.ObjectId(filters.productCategory),
        });
      }

      // // Explicit productCategory filter (separate)
      // if (filters.productCategory && mongoose.Types.ObjectId.isValid(filters.productCategory)) {
      //   andConditions.push({
      //     "productInfo.productCategory": new mongoose.Types.ObjectId(filters.productCategory),
      //   });
      // }

      // Other filters
      if (status && ["draft", "published"].includes(status)) {
        andConditions.push({ status });
      }

      if (isBlocked !== undefined) {
        andConditions.push({ isBlocked });
      }

      if (isTemplate !== undefined) {
        andConditions.push({ isTemplate });
      }

      if (isPart !== undefined) {
        andConditions.push({ isPart });
      }

      if (kind === "part") {
        andConditions.push({ kind });
      }

      // Date filter
      if (startDate || endDate) {
        const dateFilter: any = {};
        if (startDate && !isNaN(Date.parse(startDate))) dateFilter.$gte = new Date(startDate);
        if (endDate && !isNaN(Date.parse(endDate))) dateFilter.$lte = new Date(endDate);
        if (Object.keys(dateFilter).length > 0) {
          andConditions.push({ createdAt: dateFilter });
        }
      }

      // Final query assignment
      if (andConditions.length > 0) {
        query.$and = andConditions;
      }

      // Fetch filtered inventory with pagination and populate the necessary fields
      const inventory = await Inventory.find(query)
        .populate("userType")
        .populate("productInfo.productCategory")
        // .populate("productInfo.productSupplier")
        .skip(skip)
        .limit(limitNumber);

      // Count total filtered inventory
      const totalInventory = await Inventory.countDocuments(query);

      return {
        inventory,
        pagination: {
          totalInventory,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalInventory / limitNumber),
          perPage: limitNumber,
        },
      };
    } catch (error) {
      console.error("Error during search and filter:", error);
      throw new Error("Error during search and filter");
    }
  },

  //bulk import inventory
  bulkImportInventory: async (validRows: { row: number; data: any }[]): Promise<void> => {
    try {
      if (validRows.length === 0) {
        addLog("❌ No valid Inventory to import.");
        return;
      }

      addLog("🔹 Valid Rows Received for Bulk Import:");
      validRows.forEach(({ row, data }, i) => {
        try {
          addLog(`Row [${i}] => #${row}`);
          if (!data || typeof data !== "object") {
            console.log(`⚠️ Skipping row ${row}: Invalid data format. Data: ${JSON.stringify(data)}`);
          } else {
            console.log(`Data: ${JSON.stringify(data)}`);
          }
        } catch (err) {
          console.log(`❌ Error while printing row ${row}:`, err);
        }
      });
      const bulkOperations: any = (
        await Promise.all(
          validRows
            .map(({ row, data }) => {
              const normalizedData: any = {};
              for (const key in data) {
                normalizedData[key.toLowerCase()] = data[key];
              }
              return { row, data: normalizedData };
            })
            .filter(({ data }) => data && data.title)
            .map(async ({ row, data: normalizedData }) => {
              const matchedCategory = await ProductCategory.findOne({
                $or: [{ amazonCategoryId: normalizedData.amazoncategoryid }],
              }).select("_id");

              if (!matchedCategory) {
                addLog(`❌ No matching product category for Amazon ID: ${normalizedData.amazoncategoryid}`);
                return null;
              }

              // Normalize brand
              let brandList = normalizedData.brand;
              if (typeof brandList === "string") {
                brandList = brandList
                  .split(",")
                  .map((b: string) => b.trim())
                  .filter(Boolean);
              } else if (!Array.isArray(brandList)) {
                brandList = [brandList];
              }

              const isMultiBrand = brandList.length > 1;

              const productInfo: any = {
                productCategory: matchedCategory._id,
                amazonCategoryId: normalizedData.amazoncategoryid,
                title: normalizedData.title,
                description: normalizedData.description,
                inventoryImages: (normalizedData.images || []).map((url: string) => ({
                  id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  size: 0,
                  url,
                  type: "image/jpeg",
                })),
                condition_type: normalizedData.condition_type || "new_new",
                brand: brandList,
              };

              const prodTechInfo: Record<string, any> = {};
              const knownFields = new Set([
                "title",
                "description",
                "brand",
                "images",
                "videos",
                "condition_type",
                "productSupplier",
                "productSupplierKey",
                "productCategoryName",
                "amazonCategoryId",
              ]);

              for (const key in normalizedData) {
                if (!knownFields.has(key)) {
                  prodTechInfo[key] = normalizedData[key];
                }
              }

              // Set kind based on Amazon ID
              const productCategoryIds = new Set([
                "PERSONAL_COMPUTER",
                "NETWORKING_DEVICE",
                "NOTEBOOK_COMPUTER",
                "MONITOR",
                "VIDEO_PROJECTOR",
              ]);
              const kindType = productCategoryIds.has(normalizedData.amazoncategoryid?.toString()) ? "product" : "part";

              // Set isPart based on kind
              const isPart = kindType === "part";

              // Set isVariation based on prodTechInfo["allow variations"]
              const allowVar = prodTechInfo["allow variations"];
              const isVariation = typeof allowVar === "string" && allowVar.trim().toLowerCase() === "yes";
              delete prodTechInfo["allow variations"]; // optional cleanup

              const docToInsert = {
                isBlocked: false,
                kind: kindType,
                status: "draft",
                isVariation,
                isMultiBrand,
                isTemplate: false,
                isPart,
                stocks: [],
                stockThreshold: 10,
                prodTechInfo,
                productInfo,
              };

              console.log(`📝 Prepared Document for DB Insert (row ${row}): ${JSON.stringify(docToInsert)}`);

              return {
                insertOne: {
                  document: docToInsert,
                },
              };
            })
        )
      ).filter(Boolean);

      if (bulkOperations.length === 0) {
        addLog("✅ No new Inventory to insert.");
        return;
      }

      await Inventory.bulkWrite(bulkOperations);
      addLog(`✅ Bulk import completed. Successfully added ${bulkOperations.length} new Inventory.`);
    } catch (error: any) {
      addLog(`❌ Bulk import failed: ${error.message}`);
    }
  },

  exportInventory: async (params: ExportParams): Promise<ExportResult> => {
    const { inventoryIds, selectAllPages } = params;

    // Generate cache key based on export parameters
    const cacheKey = selectAllPages
      ? generateCacheKeyForAllItems() // Fixed: removed filters reference
      : generateCacheKey(inventoryIds);

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      const cachedResult = JSON.parse(cachedData);
      return {
        fromCache: true,
        file: cachedResult.file,
        totalExported: cachedResult.totalExported,
      };
    }

    let items: any[];

    if (selectAllPages) {
      // Export ALL items without any filters
      console.log("Exporting all items from database");

      items = await Inventory.find({}) // Empty query = get all items
        .populate("productInfo.productCategory", "name")
        .lean();
    } else {
      // Export specific items by IDs
      items = await Inventory.find({ _id: { $in: inventoryIds } })
        .populate("productInfo.productCategory", "name")
        .lean();
    }

    if (!items.length) {
      throw new Error("No inventory items found matching the criteria");
    }

    console.log(`Found ${items.length} items to export`);

    const categoryMap: Record<string, any[]> = {};

    for (const item of items) {
      const ebayId = item.productInfo?.ebayCategoryId || "unknown";
      const categoryName = item.productInfo?.productCategory?.name || "Uncategorized";

      const rawSheetKey = `${categoryName} (${ebayId})`;
      const sheetKey = sanitizeSheetName(rawSheetKey);
      const flatRow: Record<string, any> = {
        Title: item.productInfo?.title || "",
        Description: item.productInfo?.description?.replace(/<[^>]*>?/gm, "") || "",
        Brand: Array.isArray(item.productInfo?.brand)
          ? item.productInfo.brand.join(", ")
          : item.productInfo?.brand || "",
        condition_type: item.productInfo?.condition_type || "",
        "Allow Variations": item.isVariation ? "yes" : "no",
        Images: Array.isArray(item.productInfo?.inventoryImages)
          ? item.productInfo.inventoryImages.map((img: any) => img.url).join(", ")
          : "",
      };

      // Add dynamic attributes
      for (const [key, value] of Object.entries(item.prodTechInfo || {})) {
        flatRow[key] = Array.isArray(value) ? value.join(", ") : value;
      }

      if (!categoryMap[sheetKey]) categoryMap[sheetKey] = [];
      categoryMap[sheetKey].push(flatRow);
    }

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    for (const [sheetName, rows] of Object.entries(categoryMap)) {
      if (rows.length === 0) continue;
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Sheet name max length is 31 chars
    }

    // Write workbook to binary string
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

    // Helper function: convert binary string to ArrayBuffer
    function s2ab(s: string) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xff;
      }
      return buf;
    }

    // Convert to base64
    const base64Excel = Buffer.from(s2ab(wbout)).toString("base64");

    // Prepare result for caching
    const result = {
      file: base64Excel,
      totalExported: items.length,
    };

    // Cache the result (including metadata)
    await setCacheWithTTL(cacheKey, JSON.stringify(result), 300); // Cache 5 min

    return {
      fromCache: false,
      file: base64Excel,
      totalExported: items.length,
    };
  },

  bulkUpdateInventoryTaxAndDiscount: async (inventoryIds: string[], discountValue: number, vat: number) => {
    try {
      // Check if the discountValue and vat are numbers and valid
      if (typeof discountValue !== "number" || typeof vat !== "number") {
        throw new Error("Invalid discountValue or vat. They must be numbers.");
      }

      // Perform bulk update with nested prodPricing field
      const result = await Inventory.updateMany(
        { _id: { $in: inventoryIds } }, // Filter valid inventory IDs
        {
          $set: {
            "prodPricing.discountValue": discountValue,
            "prodPricing.vat": vat,
          },
        }
      );

      if (result.modifiedCount === 0) {
        throw new Error("No inventory were updated. Please verify inventory IDs and data.");
      }

      return result;
    } catch (error: any) {
      throw new Error(`Error during bulk update: ${error.message}`);
    }
  },

  upsertInventoryPartsService: async (inventoryId: string, selectedVariations: any) => {
    return await Inventory.findByIdAndUpdate(
      inventoryId,
      { $set: { selectedVariations } }, // If exists, update. If not, create.
      { new: true, upsert: true } // `upsert: true` ensures creation if missing.
    );
  },

  // Get selected variations for a inventory
  getSelectedInventoryPartsService: async (inventoryId: string) => {
    return await Inventory.findById(inventoryId).select("selectedVariations");
  },

  // Enhanced generateCombinations function in inventoryService
  generateCombinations: async (processedAttributes: any) => {
    console.log("Generating combinations from processed attributes:", processedAttributes);

    const attributeKeys = Object.keys(processedAttributes);
    console.log("Attribute keys:", attributeKeys);

    if (attributeKeys.length === 0) {
      console.log("No attribute keys found, returning empty array");
      return [];
    }

    const attributeValues = attributeKeys.map((key) => processedAttributes[key]);
    console.log(
      "Attribute values lengths:",
      attributeValues.map((arr) => arr.length)
    );

    // Check if any attribute has no values
    const hasEmptyAttribute = attributeValues.some((arr) => arr.length === 0);
    if (hasEmptyAttribute) {
      console.log("Found empty attribute, cannot generate combinations");
      return [];
    }

    const combinations: any[] = [];

    function generateCombinationsRecursive(current: any, actualAttributes: any, index: number) {
      if (index === attributeKeys.length) {
        // Create the final combination with display values and actual_attributes
        const combination = {
          ...current,
          actual_attributes: { ...actualAttributes },
        };
        combinations.push(combination);
        return;
      }

      const currentAttribute = attributeKeys[index];
      const currentValues = attributeValues[index];

      for (const valueObj of currentValues) {
        const newCurrent = {
          ...current,
          [currentAttribute]: valueObj.displayValue, // For display/filtering (displaySize, displayResolution)
        };

        // Handle special case for display attributes that need to be merged
        let newActualAttributes;
        if (currentAttribute === "displaySize" || currentAttribute === "displayResolution") {
          newActualAttributes = {
            ...actualAttributes,
            display: mergeDisplayAttributes(
              actualAttributes.display,
              valueObj.originalStructure,
              valueObj.attributeType
            ),
          };
        } else {
          // Map back to original attribute name for other attributes
          const actualAttributeName = getActualAttributeName(currentAttribute);
          newActualAttributes = {
            ...actualAttributes,
            [actualAttributeName]: valueObj.originalStructure, // Original DB structure
          };
        }

        generateCombinationsRecursive(newCurrent, newActualAttributes, index + 1);
      }
    }

    // Helper function to merge display attributes
    function mergeDisplayAttributes(existingDisplay: any, newDisplayStructure: any, attributeType: string) {
      if (!existingDisplay) {
        return newDisplayStructure;
      }

      // Deep clone the existing display to avoid mutations
      const merged = JSON.parse(JSON.stringify(existingDisplay));

      // Merge the specific attribute from newDisplayStructure
      newDisplayStructure.forEach((newItem: any, index: number) => {
        if (merged[index]) {
          if (attributeType === "size" && newItem.size) {
            merged[index].size = newItem.size;
          } else if (attributeType === "resolution_maximum" && newItem.resolution_maximum) {
            merged[index].resolution_maximum = newItem.resolution_maximum;
          } else if (attributeType === "technology" && newItem.technology) {
            merged[index].technology = newItem.technology;
          }
        } else {
          merged[index] = newItem;
        }
      });

      return merged;
    }

    // Helper function to map variation keys back to actual DB attribute names
    function getActualAttributeName(variationKey: string): string {
      const keyMapping: { [key: string]: string } = {
        // Add mappings for other attributes that might need renaming
        // Most attributes will use their original names
      };

      return keyMapping[variationKey] || variationKey;
    }

    generateCombinationsRecursive({}, {}, 0);

    console.log(`Generated ${combinations.length} combinations`);
    return combinations;
  },
  getAllOptions: async () => {
    try {
      const skipProductInfoFields = ["title", "description", "productCategory", "ebayCategoryId", "inventoryImages"];

      const kinds = await Inventory.distinct("kind");
      const seenFields = new Set<string>();
      const productInfoFields: string[] = [];

      // Get productInfo fields
      for (const kind of kinds) {
        const sample: any = await Inventory.findOne({
          kind,
          productInfo: { $exists: true },
        });
        if (!sample || !sample.productInfo) continue;

        const keys = Object.keys(sample.productInfo.toObject());
        keys.forEach((key) => {
          const full = `productInfo.${key}`;
          if (!skipProductInfoFields.includes(key) && !seenFields.has(full)) {
            seenFields.add(full);
            productInfoFields.push(full);
          }
        });
      }

      // Fetch all distinct productInfo values
      const productInfoResults = await Promise.all(
        productInfoFields.map((field) =>
          Inventory.distinct(field).then((values) => {
            const map = new Map();
            values
              .filter((v) => v !== "" && v !== null && v !== undefined)
              .forEach((val) => {
                const key = typeof val === "string" ? val.trim().toLowerCase() : String(val).toLowerCase();
                if (!map.has(key)) map.set(key, typeof val === "string" ? val.trim() : val);
              });

            return {
              field,
              distinctValues: Array.from(map.values()),
            };
          })
        )
      );

      // ✅ Dynamically fetch all keys in prodTechInfo (Map) using aggregation
      const prodTechKeysAgg = await Inventory.aggregate([
        { $match: { prodTechInfo: { $exists: true } } },
        { $project: { keys: { $objectToArray: "$prodTechInfo" } } },
        { $unwind: "$keys" },
        { $group: { _id: null, allKeys: { $addToSet: "$keys.k" } } },
      ]);

      const prodTechKeys: string[] = prodTechKeysAgg[0]?.allKeys || [];

      // Fetch distinct values for each dynamic key
      const prodTechResults = await Promise.all(
        prodTechKeys
          .filter((key) => key && typeof key === "string" && key.trim() !== "") // ✅ filter out empty or invalid keys
          .map((key) =>
            Inventory.distinct(`prodTechInfo.${key}`).then((values) => {
              const map = new Map();
              values
                .filter((v) => v !== "" && v !== null && v !== undefined)
                .forEach((val) => {
                  const k = typeof val === "string" ? val.trim().toLowerCase() : String(val).toLowerCase();
                  if (!map.has(k)) map.set(k, typeof val === "string" ? val.trim() : val);
                });

              return {
                key,
                distinctValues: Array.from(map.values()),
              };
            })
          )
      );

      // Assemble result
      const productInfo: Record<string, any> = {};
      productInfoResults.forEach(({ field, distinctValues }) => {
        productInfo[field.replace("productInfo.", "")] = distinctValues;
      });

      const prodTechInfo: Record<string, any> = {};
      prodTechResults.forEach(({ key, distinctValues }) => {
        prodTechInfo[key] = distinctValues;
      });

      return { productInfo, prodTechInfo };
    } catch (error) {
      console.error("❌ Error fetching all options:", error);
      throw new Error("Failed to fetch all options");
    }
  },
};

function sanitizeSheetName(name: string): string {
  return name.replace(/[:\\\/\?\*\[\]]/g, "").substring(0, 31); // Excel limits sheet names to 31 chars
}

// Helper function to generate cache key for "export all" operations
function generateCacheKeyForAllItems(): string {
  const crypto = require("crypto");
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `export_all_items_${timestamp}`; // Daily cache for all items
}

// Your existing generateCacheKey function for specific IDs
function generateCacheKey(inventoryIds: string[]): string {
  const sortedIds = [...inventoryIds].sort();
  const crypto = require("crypto");
  return `export_ids_${crypto.createHash("md5").update(sortedIds.join(",")).digest("hex")}`;
}
