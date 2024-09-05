import { Schema, model } from "mongoose";
import { compareSync, hashSync } from "bcrypt";

import { IUser, IUserMethods, UserModel } from "@/contracts/user.contract";
import { REGEX } from "@/constants/regex";
import { ENUMS } from "@/constants/enum";

const schema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      match: [REGEX.EMAIL, "Invalid email"],
      index: true,
      lowercase: true,
    },
    password: { type: String, required: [true, "Password is required"] },
    name: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: Date,
    passwordResetAt: Date,
    role: { type: String, enum: ENUMS.USER_TYPES, default: "user" },
  },
  { timestamps: true }
);

schema.methods.hashPassword = function (password: string) {
  return hashSync(password, 10);
};

schema.methods.comparePassword = function (password: string) {
  return compareSync(password, this.password);
};

schema.methods.toJSON = function () {
  const obj = this.toObject();

  obj.id = obj._id;
  delete obj.password;
  delete obj.verifications;
  delete obj.resetPasswords;

  return obj;
};

export const User = model<IUser, UserModel>("User", schema);
