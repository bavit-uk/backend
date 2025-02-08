import { initializeApp } from "firebase-admin";
import {
  getStorage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "@firebase/storage";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "@firebase/auth";
import { firebaseConfig } from "./firebaseConfig";
import { applicationDefault } from "firebase-admin/app";

const adminApp = initializeApp({
  credential: applicationDefault(), // Uses default Google Cloud credentials
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

// ✅ Initialize Firebase Client SDK (For Frontend Authentication & Storage)
const clientApp = initializeApp(firebaseConfig);

// ✅ Export Firebase Services
export const storage = getStorage(clientApp); // Client-side storage
export const adminStorage = getStorage(adminApp); // Server-side storage
export const auth = getAuth(clientApp);
export const googleProvider = new GoogleAuthProvider();

/**
 * 🔹 Upload a single file to Firebase Storage
 * @param file File object to upload
 * @param folderName Optional folder name (default: "uploads")
 * @param urlSetter Function to set the file URL after upload
 * @param setProgress Function to track upload progress
 */
export const uploadSingleFile = ({
  file,
  folderName = "uploads",
  urlSetter,
  setProgress,
}: {
  file: File | null;
  folderName?: string;
  urlSetter: (url: string) => void;
  setProgress: (progress: number) => void;
}): void => {
  if (!file) return;

  try {
    const storageRef = ref(storage, `/${folderName}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(progress);
      },
      (error) => {
        console.error("❌ Upload Error:", error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          urlSetter(url);
        } catch (err) {
          console.error("❌ Error getting download URL:", err);
        }
      }
    );
  } catch (error) {
    console.error("❌ Unexpected Error in uploadSingleFile:", error);
  }
};

/**
 * 🔹 Sign in with Google Authentication
 */
export const signInWithGoogle = async (): Promise<void> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("✅ User signed in:", result.user);
  } catch (error) {
    console.error("❌ Authentication Error:", error);
  }
};
