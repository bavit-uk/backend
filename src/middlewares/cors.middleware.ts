import cors from "cors";
import { StatusCodes } from "http-status-codes";

export const corsMiddleware = cors({
  origin: ["https://bavit-test.vercel.app", "http://localhost:3000","http://localhost:3001", "https://bavit-dev.vercel.app"], // Allows requests from any origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow these methods
  allowedHeaders: ["Content-Type", "Authorization", "x-user-type"], // Allow these headers
  credentials: true, // Allows sending cookies if needed
  optionsSuccessStatus: StatusCodes.OK, // Ensure proper status code
});
