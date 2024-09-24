import express, { Express } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { authMiddleware, corsMiddleware } from "./middlewares";
import { router } from "./routes/index.route";
import { mongoose } from "./datasources";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { rateLimitHandler } from "./utils/rate-limit-handler";
import fs from "fs";
import { socketManager } from "./datasources/socket.datasource";
import path from "path";
import sharp from "sharp";
import QRCode from "qrcode";
import { encrypt, decrypt } from "./utils/xor-strings.util";

// Configure dotenv to use .env file like .env.dev or .env.prod
dotenv.config({
  path: `.env.${process.env.NODE_ENV || "dev"}`,
});

const app: Express = express();

// Connect to MongoDB
mongoose.run();

// const accessLogStream = fs.createWriteStream(__dirname + "/access.log", { flags: "a" });

app.use(
  express.json({ limit: "10mb" }),
  express.urlencoded({ limit: "10mb", extended: true }),
  morgan("dev"),
  // morgan("combined", { stream: accessLogStream }),
  corsMiddleware,
  authMiddleware,
  helmet(),
  rateLimit({
    windowMs: 1000,
    max: 100,
    handler: rateLimitHandler,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/api/connections", (req, res) => {
  const connections = socketManager.getConnections();
  // convert to object
  const connectionsObj = Array.from(connections).reduce(
    (acc: { [key: string]: string }, [key, value]: [string, string]) => {
      acc[key] = value;
      return acc;
    },
    {}
  );
  res.json({ connectionsObj });
});

app.get("/api/composite", async (req, res) => {
  const folder = path.join(__dirname, "uploads");

  const image2 = fs.readFileSync(path.join(folder, "Simple Text.png"));
  const image1 = fs.readFileSync(path.join(folder, "Secret.png"));

  const originalImage = await sharp(image1).metadata();
  const originalHeight = originalImage.height;
  const originalWidth = originalImage.width;

  console.log("Original Image Height: ", originalHeight);
  console.log("Original Image Width: ", originalWidth);

  // load 1st image
  const image1Sharp = await sharp(image1).resize(200, 200).toBuffer();
  const image2Sharp = await sharp(image2).resize(200, 200).toBuffer();

  // composite images
  const compositeImage = await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: image1Sharp, gravity: "northwest" },
      { input: image2Sharp, gravity: "southeast", blend: "difference" },
    ])
    .png()
    .toBuffer();

  res.type("image/png").send(compositeImage);
});

app.get("/api/qrcode", async (req, res) => {
  const key = "https://www.google.com";
  const secret = "Hello World, My name is Syed Abdullah Saad and this is my confession";

  // const secret = "https://www.google.com";
  // const key = "Hello World, My name is Syed Abdullah Saad and this is my confession";

  console.log("Key: ", key);

  console.log("Secret: ", secret);

  const resultingKey = encrypt(key, secret);

  console.log("Resulting Key: ", resultingKey);

  const decryptedKey = decrypt(resultingKey, key);

  console.log("Decrypted Key: ", decryptedKey);

  await QRCode.toFile(path.join(__dirname, "uploads", "qrcode.png"), resultingKey, {
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
    width: 500,
  });

  res.type("image/png").sendFile(path.join(__dirname, "uploads", "qrcode.png"));

  // res.json({ resultingKey });
});

app.use("/api", router);

const port = process.env.PORT || 5000;

const httpServer = app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

// Add socket.io to the server
// socket.run(httpServer);
socketManager.run(httpServer);

// Graceful shutdown
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    console.log(`Received signal: ${signal}`);
    console.log("Shutting down server");
    mongoose.stop().then(() => {
      process.exit(0);
    });
  });
});

export { app };
