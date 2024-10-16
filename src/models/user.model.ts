import { Schema, model } from "mongoose";
import { compareSync, hashSync } from "bcrypt";

import { IUser, IUserMethods, UserModel } from "@/contracts/user.contract";
import { REGEX } from "@/constants/regex";
import { ENUMS } from "@/constants/enum";
import { encryptLoginQR, generateLoginQR } from "@/utils/generate-login-qr.util";
import { ISubscriptionLimit } from "@/contracts/subscription-limits.contract";

const TOTAL_ALLOWED_MESSAGES_IN_FREE_PLAN = parseInt(
  (process.env.TOTAL_ALLOWED_MESSAGES_IN_FREE_PLAN || 250).toString()
);
const TOTAL_ALLOWED_CHATS_IN_FREE_PLAN = parseInt((process.env.TOTAL_ALLOWED_CHATS_IN_FREE_PLAN || 10).toString());

const SubscriptionLimitSchema = new Schema<ISubscriptionLimit>({
  totalMessages: { type: Number, default: TOTAL_ALLOWED_MESSAGES_IN_FREE_PLAN },
  totalChats: { type: Number, default: TOTAL_ALLOWED_CHATS_IN_FREE_PLAN },
  remainingChats: { type: Number, default: TOTAL_ALLOWED_CHATS_IN_FREE_PLAN },
  remainingMessages: { type: Number, default: TOTAL_ALLOWED_MESSAGES_IN_FREE_PLAN },
});
const schema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      match: [REGEX.EMAIL, "Invalid email"],
      maxlength: [255, "Email is too long"],
      index: true,
      lowercase: true,
    },
    password: { type: String, required: [true, "Password is required"], select: false },
    role: { type: String, enum: ENUMS.USER_TYPES, default: "user" },
    dob: {
      type: Date,
    },
    mobileNumber: { type: String },
    countryCode: { type: String },
    countryCodeName: { type: String },
    profilePicture: { type: String },
    address: { type: String },
    status: {
      type: String,
      enum: ENUMS.USER_STATUS,
      default: "active",
    },
    notificationStatus: {
      type: Boolean,
      default: true,
    },
    locationStatus: {
      type: String,
      enum: ENUMS.LOCATION_STATUS,
    },
    latitude: { type: Number, select: false },
    longitude: { type: Number, select: false },
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    hasTwoFactorAuth: { type: Boolean, default: false },
    bio: { type: String },
    loginWithQRCode: { type: Boolean, default: false },
    loginQRCode: { type: String },
    profileQrCode: { type: String },
    // TODO: Add Ref to Plan Model
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, select: false },
    passwordResetAt: { type: Date, select: false },
    deviceType: { type: String, enum: ENUMS.DEVICE_TYPES },
    deviceUniqueId: String,
    fcmToken: String,
    allowResetPassword: { type: Boolean, default: false },
    stripeCustomerId: { type: String },
    subscriptionId: { type: String },
    isSubscriptionActive: { type: Boolean, default: false },
    subscriptionActivatedAt: { type: Date },
    lastPaymentAt: { type: Date },
    subscriptionExpiresAt: { type: Date },
    limits: {
      type: SubscriptionLimitSchema,
      default: {
        totalMessages: TOTAL_ALLOWED_MESSAGES_IN_FREE_PLAN,
        totalChats: TOTAL_ALLOWED_CHATS_IN_FREE_PLAN,
        remainingChats: TOTAL_ALLOWED_CHATS_IN_FREE_PLAN,
        remainingMessages: TOTAL_ALLOWED_MESSAGES_IN_FREE_PLAN,
      },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

schema.methods.hashPassword = function (password: string) {
  return hashSync(password, 10);
};

schema.methods.comparePassword = function (password: string) {
  return compareSync(password, this.password);
};

schema.virtual("loginQRCodeData").get(function () {
  if (!this.loginQRCode) {
    return null;
  }
  return encryptLoginQR(this.loginQRCode);
});

schema.methods.toJSON = function () {
  const obj = this.toObject();

  obj.id = obj._id;

  delete obj.password;

  return obj;
};

export const User = model<IUser, UserModel>("User", schema);
