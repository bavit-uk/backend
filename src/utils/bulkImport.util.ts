import fs from "fs";
import Papa from "papaparse";

import mongoose from "mongoose";
import path from "path";
import AdmZip from "adm-zip";
import { v4 as uuidv4 } from "uuid";
import { getStorage } from "firebase-admin/storage";
import { adminStorage } from "./firebase";
import { Product, User } from "@/models";

// ✅ Function to Upload File to Firebase
// ✅ Import Firebase setup

// ✅ Function to Upload File to Firebase Storage
const uploadToFirebase = async (
  filePath: string,
  destination: string
): Promise<string> => {
  if (!filePath) throw new Error("No file provided!");

  try {
    const storageFile = adminStorage.file(destination);

    await storageFile.save(filePath, {
      metadata: {
        contentType: destination.includes("videos")
          ? "video/mp4"
          : "image/jpeg",
      },
      public: true, // ✅ Make file publicly accessible
    });

    // ✅ Generate and return the public URL
    const publicUrl = `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/${destination}`;
    console.log("✅ File uploaded successfully:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    throw error;
  }
};
/**
 * Validate CSV Data based on Product Schema
 * @param {string} filePath - Path to the CSV file.
 * @returns {object} - Validation result with valid and invalid rows.
 */
const validateCsvData = async (csvFilePath: string) => {
  const requiredColumns = [
    "brand",
    "title",
    "productDescription",
    "productSupplierKey",
    "productCategory",
    "price",
  ];

  const csvContent = fs.readFileSync(csvFilePath, "utf8");
  const parsedCSV = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsedCSV.errors.length > 0)
    throw new Error(`CSV Parsing Errors: ${JSON.stringify(parsedCSV.errors)}`);

  const validRows: { row: number; data: any }[] = [];
  const invalidRows: { row: number; errors: string[] }[] = [];

  for (const [index, row] of (parsedCSV.data as any[]).entries()) {
    const errors: string[] = [];

    // ✅ Validate Required Fields
    requiredColumns.forEach((col) => {
      if (!row[col]?.trim()) errors.push(`${col} is missing or empty`);
    });

    // ✅ Validate Price
    if (!row.price || isNaN(parseFloat(row.price)))
      errors.push("Price must be a valid number");

    // ✅ Validate SupplierKey from DB
    // Inside validateCsvData function
    if (row.productSupplierKey) {
      const supplier = await User.findOne({
        SupplierKey: row.productSupplierKey,
      }).select("_id");
      if (!supplier) {
        errors.push(
          `SupplierKey ${row.productSupplierKey} does not exist in the database`
        );
      } else {
        row.productSupplier = supplier._id; // Correctly map supplier _id
      }
    } else {
      errors.push("productSupplierKey is required");
    }
    // ✅ Validate MongoDB ObjectId fields
    if (row.productCategory && !mongoose.isValidObjectId(row.productCategory))
      errors.push("productCategory must be a valid MongoDB ObjectId");
    if (row.productSupplier && !mongoose.isValidObjectId(row.productSupplier))
      errors.push("productSupplier must be a valid MongoDB ObjectId");
    if (errors.length > 0) {
      invalidRows.push({ row: index + 1, errors });
    } else {
      validRows.push({ row: index + 1, data: row });
    }
  }

  return { validRows, invalidRows };
};
// Adjust the import path as needed

const processZipFile = async (zipFilePath: string) => {
  // Define extractPath at the beginning of the function
  const extractPath = path.join(__dirname, "extracted");

  try {
    // Step 0: Validate ZIP file path
    if (!fs.existsSync(zipFilePath)) {
      throw new Error(`ZIP file does not exist: ${zipFilePath}`);
    }

    // Step 1: Extract ZIP file
    const zip = new AdmZip(zipFilePath);

    // Ensure the extraction directory exists
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }

    zip.extractAllTo(extractPath, true);

    // Step 2: Validate extracted files
    const files = fs.readdirSync(extractPath);
    const csvFile = files.find((f) => f.endsWith(".csv"));
    const mediaFolder = files.find((f) =>
      fs.lstatSync(path.join(extractPath, f)).isDirectory()
    );

    if (!csvFile || !mediaFolder) {
      throw new Error("Invalid ZIP structure. Missing CSV or media folder.");
    }

    // Step 3: Validate CSV data
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

    // Step 4: Process valid products
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

      // Step 5: Upload media files to Firebase
      const imageUrls = await Promise.all(
        images.map((img) =>
          uploadToFirebase(
            img,
            `products/${folderIndex}/images/${uuidv4()}.jpg`
          )
        )
      );
      const videoUrls = await Promise.all(
        videos.map((vid) =>
          uploadToFirebase(
            vid,
            `products/${folderIndex}/videos/${uuidv4()}.mp4`
          )
        )
      );

      // Step 6: Update product data with Firebase URLs
      data.images = imageUrls;
      data.videos = videoUrls;
    }

    console.log(`✅ ${validRows.length} valid products ready for insertion.`);

    // Step 7: Insert valid products into the database
    await Product.insertMany(validRows.map(({ data }) => data));

    console.log(`🎉 Successfully inserted ${validRows.length} products.`);
  } catch (error) {
    console.error("❌ Error processing ZIP file:", error);
    throw error;
  } finally {
    // Step 8: Clean up extracted files (optional)
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
  }
};
// ✅ Run the function with a ZIP file
// processZipFile("path/to/uploaded.zip");
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
    await Product.bulkWrite(bulkOperations);
    console.log(
      `✅ Bulk import completed. Successfully added ${validRows.length} new products.`
    );
  } catch (error) {
    console.error("❌ Bulk import failed:", error);
  }
};
// ✅ Main Function to Process ZIP File

export { bulkImportProducts, validateCsvData };
