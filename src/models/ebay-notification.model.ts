import { Schema, model, models } from "mongoose";

export interface IEbayNotification {
  _id?: string;
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const EbayNotificationSchema = new Schema<IEbayNotification>(
  {
    data: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
EbayNotificationSchema.index({ createdAt: 1 });

export const EbayNotificationModel =
  models.EbayNotification || model<IEbayNotification>("EbayNotification", EbayNotificationSchema);
