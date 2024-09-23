import { ENUMS } from "@/constants/enum";
import { Model, ObjectId } from "mongoose";

export interface IUser {
  id: ObjectId;
  name: string;
  email: string;
  password: string;
  passwordResetAt?: Date;
  role: (typeof ENUMS.USER_TYPES)[number];
  dob?: Date;
  mobileNumber: string;
  countryCode: string;
  countryCodeName: string;
  profilePicture?: string;
  address?: string;
  status: (typeof ENUMS.USER_STATUS)[number];
  notificationStatus: (typeof ENUMS.NOTIFICATION_STATUS)[number];
  locationStatus: (typeof ENUMS.LOCATION_STATUS)[number];
  latitude?: number;
  longitude?: number;
  otp?: string;
  otpExpiresAt?: Date;
  verified: boolean;
  verifiedAt?: Date;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  hasTwoFactorAuth: boolean;
  bio?: string;
  loginWithQRCode: boolean;
  loginQRCode?: string;
  profileQrCode?: string;
  planId?: ObjectId;
  isPlanActive: boolean;
  planPurchasedAt?: Date;
  planExpiredAt?: Date;
  deviceType?: (typeof ENUMS.DEVICE_TYPES)[number];
  deviceUniqueId?: string;
}

export interface IUserMethods {
  comparePassword: (password: string) => boolean;
  hashPassword: (password: string) => string;
}

export type UserCreatePayload = Pick<IUser, "name" | "email" | "password" | "otp">;

export type UserUpdatePayload = Omit<
  Partial<UserCreatePayload> & Pick<IUser, "bio" | "dob" | "mobileNumber" | "countryCode" | "countryCodeName">,
  "password" | "otp"
>;

export type UserModel = Model<IUser, unknown, IUserMethods>;

export type ResetPasswordPayload = Pick<IUser, "email">;
