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

// Configure dotenv to use .env file like .env.dev or .env.prod
dotenv.config({
  path: `.env.${process.env.NODE_ENV || "dev"}`,
});

const app: Express = express();

// Connect to MongoDB
mongoose.run();

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
