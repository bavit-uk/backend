import * as admin from "firebase-admin"; // ✅ Fix import
import { getStorage } from "firebase-admin/storage";
import { applicationDefault } from "firebase-admin/app";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

// ✅ Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV || "dev"}` });

// ✅ Get Service Account Key from JSON
const serviceAccountPath = path.resolve(__dirname, "../../firebase-admin.json");

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `❌ Firebase service account file not found at ${serviceAccountPath}`
  );
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// ✅ Initialize Firebase Admin SDK
const adminApp = admin.initializeApp({
  credential: applicationDefault(), // Or admin.credential.cert(serviceAccount)
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "axiom-528ab.appspot.com",
});

// ✅ Get Firebase Storage Bucket
export const adminStorage = getStorage(adminApp).bucket();

/**
 * 🔹 Upload a single file to Firebase Storage (Node.js Backend)
 * @param filePath Path to the file
 * @param destination Destination path in Firebase Storage
 * @returns Download URL of the uploaded file
 */
export const uploadFileToFirebase = async (
  filePath: string,
  destination: string
): Promise<string> => {
  if (!filePath) {
    throw new Error("❌ No file path provided for upload.");
  }

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
    console.error("❌ Firebase Storage Upload Error:", error);
    throw error;
  }
};

export default adminApp;
