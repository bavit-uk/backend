import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { applicationDefault } from "firebase-admin/app";
import path from "path";
import dotenv from "dotenv";

// ✅ Load environment variables
dotenv.config();
// dotenv.config({ path: path.resolve(__dirname, "../../.env.dev") });
// ✅ Initialize Firebase Admin SDK (For Backend)
const adminApp = admin.initializeApp({
  credential: applicationDefault(), // Uses Google Cloud default credentials
  // storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Ensure this is set in .env
  storageBucket: "axiom-528ab.appspot.com", // Ensure this is set in .env
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
