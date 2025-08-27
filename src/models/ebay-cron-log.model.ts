import { Schema, model } from "mongoose";
import { IEbayCronLog, IEbayCronLogModel } from "@/contracts/ebay-cron-logs.contract";

const ebayCronLogSchema = new Schema<IEbayCronLog, IEbayCronLogModel>(
  {
    // Basic identification
    jobId: {
      type: String,
      required: true,
      index: true,
    },
    jobType: {
      type: String,
      required: true,
      index: true,
    },
    jobName: {
      type: String,
      required: true,
      index: true,
    },

    // Execution details
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      index: true,
    },
    duration: {
      type: Number, // in milliseconds
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      required: true,
      index: true,
    },
    errorMessage: {
      type: String,
      maxlength: 1000,
    },

    // Process data
    itemsProcessed: {
      type: Number,
      default: 0,
      index: true,
    },
    itemsSkipped: {
      type: Number,
      default: 0,
    },
    itemsFailed: {
      type: Number,
      default: 0,
    },
    itemsCreated: {
      type: Number,
      default: 0,
    },
    itemsUpdated: {
      type: Number,
      default: 0,
    },

    // eBay context
    sellerUsername: {
      type: String,
      index: true,
    },
    environment: {
      type: String,
      enum: ["production", "sandbox"],
      default: "production",
      index: true,
    },

    // Metadata
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for common query patterns
ebayCronLogSchema.index({ jobType: 1, status: 1 });
ebayCronLogSchema.index({ sellerUsername: 1, environment: 1 });
ebayCronLogSchema.index({ startTime: 1, status: 1 });
ebayCronLogSchema.index({ jobType: 1, startTime: 1 });

// TTL index to automatically clean up old logs (optional - uncomment if needed)
// ebayCronLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

// Custom model methods
ebayCronLogSchema.statics.getJobHistory = async function (jobId: string, limit: number = 50): Promise<IEbayCronLog[]> {
  return this.find({ jobId }).sort({ startTime: -1 }).limit(limit).exec();
};

ebayCronLogSchema.statics.getFailedJobs = async function (days: number = 7): Promise<IEbayCronLog[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.find({
    status: "failed",
    startTime: { $gte: cutoffDate },
  })
    .sort({ startTime: -1 })
    .exec();
};

export const EbayCronLog = model<IEbayCronLog, IEbayCronLogModel>("EbayCronLog", ebayCronLogSchema);
