import fs from "fs";
import Papa from "papaparse";
import mongoose from "mongoose";
import { Product } from "@/models";

/**
 * Validate CSV Data based on Product Schema
 * @param {string} filePath - Path to the CSV file.
 * @returns {object} - Validation result with valid and invalid rows.
 */
const validateCsvData = (filePath: string) => {
  const requiredColumns = [
    "brand",
    "title",
    "productDescription",
    "productSupplier",
    "productCategory",
    "price",
    "images",
    "videos",
  ];

  // Read and parse CSV file
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

  console.log("PARSED DATA::: ", parsedData.data);

  parsedData.data.forEach((row: any, index: number) => {
    const errors: string[] = [];

    // ✅ Required Fields Validation
    requiredColumns.forEach((col) => {
      if (!row[col]?.trim()) errors.push(`${col} is missing or empty`);
    });

    // ✅ Validate ObjectId fields
    if (row.productCategory && !mongoose.isValidObjectId(row.productCategory)) {
      errors.push("productCategory must be a valid MongoDB ObjectId");
    }
    if (row.productSupplier && !mongoose.isValidObjectId(row.productSupplier)) {
      errors.push("productSupplier must be a valid MongoDB ObjectId");
    }
    // ✅ Validate Price
    if (!row.price || isNaN(parseFloat(row.price))) {
      errors.push("Price must be a valid number");
    }

    // ✅ Convert CSV Strings to Arrays for Images
    row.images = row.images
      ? row.images.split(",").map((url: string) => url.trim())
      : [];
    row.videos = row.videos
      ? row.videos.split(",").map((url: string) => url.trim())
      : [];
    if (errors.length > 0) {
      invalidRows.push({ row: index + 1, errors });
    } else {
      validRows.push({ row: index + 1, data: row });
    }
  });

  return { validRows, invalidRows };
};

/**
 * Perform the bulk insert after validation
 * @param {string} filePath - The path to the CSV file.
 */
const bulkImportProducts = async (filePath: string) => {
  try {
    const { validRows, invalidRows } = validateCsvData(filePath);

    if (invalidRows.length > 0) {
      console.log("❌ Some rows are invalid. Please fix the following errors:");
      invalidRows.forEach(({ row, errors }) => {
        console.log(`Row ${row}: ${errors.join(", ")}`);
      });
      return;
    }

    const bulkOperations = validRows.map(({ data }) => ({
      insertOne: {
        document: {
          // title: data.title,
          // brand: data.brand,
          // productDescription: data.productDescription,
          // productCategory: new mongoose.Types.ObjectId(data.productCategory),
          // price: parseFloat(data.price),
          // media: {
          //   images: data.images.map((url: string) => ({
          //     url,
          //     type: "image/jpeg",
          //   })),
          // },
          platformDetails: ["amazon", "ebay", "website"].reduce(
            (acc: { [key: string]: any }, platform) => {
              acc[platform] = {
                productInfo: {
                  brand: data.brand,
                  title: data.title,
                  productDescription: data.productDescription,
                  productCategory: new mongoose.Types.ObjectId(
                    data.productCategory
                  ),
                  productSupplier: new mongoose.Types.ObjectId(
                    data.productSupplier
                  ),
                },
                prodPricing: {
                  price: parseFloat(data.price),
                  condition: "new",
                  quantity: 10,
                  vat: 5,
                },
                prodMedia: {
                  images: data.images.map((url: string) => ({
                    url,
                    type: "image/jpeg",
                  })),
                  // videos: [],
                  videos: data.videos.map((url: string) => ({
                    url,
                    type: "video/mp4",
                  })),
                },
              };
              return acc;
            },
            {}
          ),
        },
      },
    }));

    // ✅ Perform Bulk Insert Operation
    await Product.bulkWrite(bulkOperations, { strict: false });
    console.log(
      `✅ Bulk import completed. Successfully added ${validRows.length} new products.`
    );
  } catch (error) {
    console.error("❌ Bulk import failed:", error);
  }
};

export { bulkImportProducts, validateCsvData };
