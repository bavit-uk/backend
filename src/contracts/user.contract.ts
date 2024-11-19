import { Document, Model, Types } from "mongoose";



export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  signUpThrough: string;
  profileImage?: string;
  EmailVerifiedOTP?: string;
  EmailVerifiedOTPExpiredAt?: Date;
  isEmailVerified: boolean;
  EmailVerifiedAt: Date;
  userType: Types.ObjectId;
  additionalAccessRights: string[];
  restrictedAccessRights: string[];
  phoneNumber: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number
}



export type UserCreatePayload = Pick<IUser , "firstName" | "lastName" | "email" | "password" | "signUpThrough" | "phoneNumber" | "userType" | "additionalAccessRights" | "restrictedAccessRights">
export type UserSignupPayload = Pick<IUser , "firstName" | "lastName" | "email" | "password" | "signUpThrough">

export interface IUserMethods {
  comparePassword: (password: string) => boolean;
  hashPassword: (password: string) => string;
}


export type UserModel = Model<IUser, unknown, IUserMethods>;
