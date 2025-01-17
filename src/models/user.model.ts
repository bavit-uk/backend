import mongoose, { Schema, model, Document } from "mongoose";
import { REGEX } from "@/constants/regex";
import {
  IFile,
  IUser,
  IUserMethods,
  UserModel,
} from "@/contracts/user.contract";
import { compareSync, hashSync } from "bcrypt";
import { ENUMS } from "@/constants/enum";

const validateEmail = (email: string) => REGEX.EMAIL.test(email);

export const fileSchema = {
  originalname: { type: String },
  encoding: { type: String },
  mimetype: { type: String },
  size: { type: Number },
  url: { type: String },
  filename: { type: String },
};

const schema = new Schema<IUser, UserModel, IUserMethods>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: {
      type: String,
      required: true,
      lowercase: true,
      validate: {
        validator: validateEmail,
        message: "Invalid email format",
      },
    },
    password: { type: String, select: false },
    phoneNumber: { type: String },
    dob: { type: String },
    // address: [{ type: Schema.Types.ObjectId, ref: "Address" }],
    signUpThrough: {
      type: String,
      enum: ENUMS.SIGNUP_THROUGH,
      required: true,
      default: "Web",
    },
    profileImage: { type: String },
    // EmailVerifiedOTP: { type: String },
    // EmailVerifiedOTPExpiredAt: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    EmailVerifiedAt: { type: Date },
    userType: { type: Schema.Types.ObjectId, ref: "UserCategory" }, // Reference to UserCategory
    supplierCategory: { type: Schema.Types.ObjectId, ref: "SupplierCategory" },
    additionalAccessRights: { type: [String], default: [] }, // Add specific rights
    restrictedAccessRights: { type: [String], default: [] }, // Remove specific rights
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Number },
    documents: [{ type: fileSchema }], // Store supplier-related files
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.methods.hashPassword = function (password: string) {
  return hashSync(password, 10);
};

schema.methods.comparePassword = function (password: string) {
  return compareSync(password, this.password);
};

export const User = model<IUser, UserModel>("User", schema);
