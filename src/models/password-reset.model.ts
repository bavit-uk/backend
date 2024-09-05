import { Schema, model } from "mongoose";

import { IPasswordReset, PasswordResetModel } from "@/contracts/password-reset.contract";

const schema = new Schema<IPasswordReset, PasswordResetModel>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    token: {
      type: String,
      required: [true, "Token is required"],
    },
    expireAt: {
      type: Date,
      required: [true, "ExpireAt is required"],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

schema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  return obj;
};

export const PasswordReset = model<IPasswordReset, PasswordResetModel>("PasswordReset", schema);
