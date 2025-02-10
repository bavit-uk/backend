import fs from "fs";
import Papa from "papaparse";
import path from "path";
import AdmZip from "adm-zip";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { getStorage } from "firebase-admin/storage";
import { adminStorage } from "./firebase";
import { Product, User } from "@/models";

// ✅ Function to Upload File to Firebase Storage
const uploadToFirebase = async (
  filePath: string,
  destination: string
): Promise<string | null> => {
  if (!filePath) throw new Error("No file provided!");
  try {
    const storageFile = adminStorage.file(destination);
    await storageFile.save(filePath, {
      metadata: {
        contentType: destination.includes("videos")
          ? "video/mp4"
          : "image/jpeg",
      },
      public: true,
    });
    return `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/${destination}`;
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    return null; // Return null instead of throwing an error
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

const processZipFile = async (zipFilePath: any) => {
  const extractPath = path.join(process.cwd(), "extracted");
  try {
    if (!fs.existsSync(zipFilePath))
      throw new Error(`ZIP file does not exist: ${zipFilePath}`);
    const zip = new AdmZip(zipFilePath);
    if (!fs.existsSync(extractPath))
      fs.mkdirSync(extractPath, { recursive: true });
    zip.extractAllTo(extractPath, true);

    const files = fs.readdirSync(extractPath);
    const csvFile = files.find((f) => f.endsWith(".csv"));
    const mediaFolder = files.find((f) =>
      fs.lstatSync(path.join(extractPath, f)).isDirectory()
    );
    if (!csvFile || !mediaFolder)
      throw new Error("Invalid ZIP structure. Missing CSV or media folder.");

    const { validRows } = await validateCsvData(
      path.join(extractPath, csvFile)
    );
    if (validRows.length === 0) return;

    for (const [index, { data }] of validRows.entries()) {
      const folderIndex = (index + 1).toString();
      const productMediaPath = path.join(extractPath, mediaFolder, folderIndex);
      if (!fs.existsSync(productMediaPath)) continue;

      const uploadFiles = async (files: string[], destination: string) => {
        const uploads = files.map((file) =>
          uploadToFirebase(file, `${destination}/${uuidv4()}`)
        );
        const results = await Promise.allSettled(uploads);
        return results
          .filter((res) => res.status === "fulfilled")
          .map((res) => res.value);
      };

      const imagesFolder = path.join(productMediaPath, "images");
      const videosFolder = path.join(productMediaPath, "videos");

      data.images = fs.existsSync(imagesFolder)
        ? await uploadFiles(
            fs.readdirSync(imagesFolder).map((f) => path.join(imagesFolder, f)),
            `products/${folderIndex}/images`
          )
        : [];

      data.videos = fs.existsSync(videosFolder)
        ? await uploadFiles(
            fs.readdirSync(videosFolder).map((f) => path.join(videosFolder, f)),
            `products/${folderIndex}/videos`
          )
        : [];
    }

    await Product.insertMany(validRows.map(({ data }) => data));
  } catch (error) {
    console.error("❌ Error processing ZIP file:", error);
  } finally {
    if (fs.existsSync(extractPath))
      fs.rmSync(extractPath, { recursive: true, force: true });
  }
};
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
import { Request, Response } from "express";

const handleBulkImport = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const zipFilePath = req.file.path;
    await processZipFile(zipFilePath);
    fs.unlinkSync(zipFilePath);
    res.status(200).json({ message: "File processing started" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
};

export {bulkImportProducts, validateCsvData, processZipFile, handleBulkImport };
