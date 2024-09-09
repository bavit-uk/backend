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

// Configure dotenv to use .env file like .env.dev or .env.prod
dotenv.config({
  path: `.env.${process.env.NODE_ENV || "dev"}`,
});

// Connect to MongoDB
mongoose.run();

const app: Express = express();
const accessLogStream = fs.createWriteStream(__dirname + "/access.log", { flags: "a" });

app.use(
  express.json({ limit: "10mb" }),
  express.urlencoded({ limit: "10mb", extended: true }),
  morgan("dev"),
  morgan("combined", { stream: accessLogStream }),
  corsMiddleware,
  authMiddleware,
  helmet(),
  rateLimit({
    windowMs: 1000,
    max: 100,
    handler: rateLimitHandler,
  })
);

app.use("/api", router);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down server");
  mongoose.stop().then(() => {
    process.exit(0);
  });
});

export { app };
