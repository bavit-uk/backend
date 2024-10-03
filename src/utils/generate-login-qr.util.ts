import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export const generateLoginQR = () => {
  const qrId = uuidv4();
  const encryption = encryptLoginQR(qrId);

  return {
    qrId,
    encryption,
  };
};

export const encryptLoginQR = (qrId: string) => {
  const algorithm = "aes-256-cbc";
  const key = process.env.ENCRYPTION_KEY || "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(qrId, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

export const decryptLoginQR = (encrypted: string) => {
  if (!encrypted || encrypted === "" || encrypted === null) {
    throw new Error("Invalid encrypted data");
  }

  if (!encrypted.includes(":")) {
    throw new Error("Invalid encrypted data");
  }

  const algorithm = "aes-256-cbc";
  const key = process.env.ENCRYPTION_KEY || "";
  const [iv, encryptedData] = encrypted.split(":");
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, "hex"));
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
