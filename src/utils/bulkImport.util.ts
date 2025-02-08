import fs from "fs";
import Papa from "papaparse";
import mongoose from "mongoose";
import { Product, User } from "@/models";

import path from "path";
import AdmZip from "adm-zip";

import { v4 as uuidv4 } from "uuid";

import admin from "firebase-admin";

const serviceAccount = require(path.join(__dirname, "firebase-service.json"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "your-bucket-name.appspot.com",
});
const bucket = admin.storage().bucket();

// ✅ Function to Upload File to Firebase
const uploadToFirebase = async (filePath: string, destination: string) => {
  const file = await bucket.upload(filePath, {
    destination,
    public: true,
    metadata: {
      contentType: destination.includes("videos") ? "video/mp4" : "image/jpeg",
    },
  });
  return file[0].metadata.mediaLink; // ✅ Return public URL
};

/**
 * Validate CSV Data based on Product Schema
 * @param {string} filePath - Path to the CSV file.
 * @returns {object} - Validation result with valid and invalid rows.
 */
const validateCsvData = async (filePath: string) => {
  const requiredColumns = [
    "brand",
    "title",
    "productDescription",
    "productSupplierKey", // Use SupplierKey instead of productSupplier
    "productCategory",
    "price",
    "images",
    "videos",
  ];

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

  for (let index = 0; index < parsedData.data.length; index++) {
    const row: any = parsedData.data[index];
    const errors: string[] = [];

    // ✅ Required Fields Validation
    requiredColumns.forEach((col) => {
      if (!row[col]?.trim()) errors.push(`${col} is missing or empty`);
    });

    // ✅ Validate ObjectId fields
    if (row.productCategory && !mongoose.isValidObjectId(row.productCategory)) {
      errors.push("productCategory must be a valid MongoDB ObjectId");
    }

    // ✅ Validate Price
    if (!row.price || isNaN(parseFloat(row.price))) {
      errors.push("Price must be a valid number");
    }

    // ✅ Convert CSV Strings to Arrays
    row.images = row.images
      ? row.images.split(",").map((url: string) => url.trim())
      : [];
    row.videos = row.videos
      ? row.videos.split(",").map((url: string) => url.trim())
      : [];

    // ✅ Validate SupplierKey from DB
    if (row.productSupplierKey) {
      const supplier = await User.findOne({
        SupplierKey: row.productSupplierKey,
      }).select("_id");
      if (!supplier) {
        errors.push(
          `SupplierKey ${row.productSupplierKey} does not exist in the database`
        );
      } else {
        row.productSupplier = supplier._id; // Replace supplierKey with actual _id
      }
    } else {
      errors.push("productSupplierKey is required");
    }

    if (errors.length > 0) {
      invalidRows.push({ row: index + 1, errors });
    } else {
      validRows.push({ row: index + 1, data: row });
    }
  }

  return { validRows, invalidRows };
};

/**
 * Perform the bulk insert after validation
 * @param {string} filePath - The path to the CSV file.
 */
const bulkImportProducts = async (filePath: string) => {
  try {
    const { validRows, invalidRows } = await validateCsvData(filePath);

    if (invalidRows.length > 0) {
      console.log("❌ Some rows were skipped due to validation errors:");
      invalidRows.forEach(({ row, errors }) => {
        console.log(`Row ${row}: ${errors.join(", ")}`);
      });
    }

    if (validRows.length === 0) {
      console.log("❌ No valid products to import.");
      return;
    }

    const bulkOperations = validRows.map(({ data }) => ({
      insertOne: {
        document: {
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
// ✅ Main Function to Process ZIP File
const processZipFile = async (zipFilePath: string) => {
  const zip = new AdmZip(zipFilePath);
  const extractPath = path.join(__dirname, "extracted");
  zip.extractAllTo(extractPath, true);

  const files = fs.readdirSync(extractPath);
  const csvFile = files.find((f) => f.endsWith(".csv"));
  const mediaFolder = files.find((f) =>
    fs.lstatSync(path.join(extractPath, f)).isDirectory()
  );

  if (!csvFile || !mediaFolder) {
    throw new Error("Invalid ZIP structure. Missing CSV or media folder.");
  }

  // ✅ Step 1: Validate CSV
  const { validRows, invalidRows } = await validateCsvData(
    path.join(extractPath, csvFile)
  );

  if (invalidRows.length > 0) {
    console.log("❌ Some products are invalid. Skipping them:");
    invalidRows.forEach(({ row, errors }) =>
      console.log(`Row ${row}: ${errors.join(", ")}`)
    );
  }

  if (validRows.length === 0) {
    console.log("❌ No valid products to process.");
    return;
  }

  // ✅ Step 2: Process Only Valid Product Folders
  for (const [index, { data }] of validRows.entries()) {
    const folderIndex = (index + 1).toString();
    const productMediaPath = path.join(extractPath, mediaFolder, folderIndex);

    if (!fs.existsSync(productMediaPath)) {
      console.log(
        `⚠️ No media folder found for Product Row ${index + 1}, skipping...`
      );
      continue;
    }

    const imagesFolder = path.join(productMediaPath, "images");
    const videosFolder = path.join(productMediaPath, "videos");

    const images = fs.existsSync(imagesFolder)
      ? fs
          .readdirSync(imagesFolder)
          .map((file) => path.join(imagesFolder, file))
      : [];
    const videos = fs.existsSync(videosFolder)
      ? fs
          .readdirSync(videosFolder)
          .map((file) => path.join(videosFolder, file))
      : [];

    // ✅ Upload Only for Valid Products
    const imageUrls = await Promise.all(
      images.map((img) =>
        uploadToFirebase(img, `products/${folderIndex}/images/${uuidv4()}.jpg`)
      )
    );
    const videoUrls = await Promise.all(
      videos.map((vid) =>
        uploadToFirebase(vid, `products/${folderIndex}/videos/${uuidv4()}.mp4`)
      )
    );

    // ✅ Update Row Data with Firebase URLs
    data.images = imageUrls;
    data.videos = videoUrls;
  }

  console.log(`✅ ${validRows.length} valid products ready for insertion.`);

  // ✅ Step 3: Bulk Insert into Database
  await Product.insertMany(validRows.map(({ data }) => data));

  console.log(`🎉 Successfully inserted ${validRows.length} products.`);
};

// ✅ Run the function with a ZIP file
processZipFile("path/to/uploaded.zip");

export { bulkImportProducts, validateCsvData };
