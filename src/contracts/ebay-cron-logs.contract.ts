import { Model, Types } from "mongoose";

/**
 * Interface for eBay cron job logs
 */
export interface IEbayCronLog {
  _id?: Types.ObjectId;

  // Basic identification
  jobId: string; // Unique identifier for the cron job instance
  jobType: string; // Type of job (e.g., "message_sync", "order_sync", "listing_sync")
  jobName: string; // Human-readable name

  // Execution details
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  status: "pending" | "running" | "completed" | "failed";
  errorMessage?: string;

  // Process data
  itemsProcessed?: number;
  itemsSkipped?: number;
  itemsFailed?: number;
  itemsCreated?: number;
  itemsUpdated?: number;

  // eBay context
  sellerUsername?: string;
  environment?: "production" | "sandbox";

  // Metadata
  tags?: string[];
  metadata?: Record<string, any>; // Additional custom fields

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for creating a new cron log entry
 */
export interface IEbayCronLogCreate {
  jobId: string;
  jobType: string;
  jobName: string;
  startTime: Date;
  status: "pending" | "running" | "completed" | "failed";
  sellerUsername?: string;
  environment?: "production" | "sandbox";
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Interface for updating a cron log entry
 */
export interface IEbayCronLogUpdate {
  endTime?: Date;
  duration?: number;
  status?: "pending" | "running" | "completed" | "failed";
  errorMessage?: string;
  itemsProcessed?: number;
  itemsSkipped?: number;
  itemsFailed?: number;
  itemsCreated?: number;
  itemsUpdated?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Interface for querying cron logs
 */
export interface IEbayCronLogQuery {
  jobType?: string;
  status?: string;
  sellerUsername?: string;
  environment?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Interface for the cron log model
 */
export interface IEbayCronLogModel extends Model<IEbayCronLog> {
  // Basic model methods
  getJobHistory(jobId: string, limit?: number): Promise<IEbayCronLog[]>;
  getFailedJobs(days?: number): Promise<IEbayCronLog[]>;
}
