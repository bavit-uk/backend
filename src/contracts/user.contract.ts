import { Document, Model, Types } from "mongoose";


export interface IFile {
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  url: string;
  filename: string;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dob: Date;
  address: Types.ObjectId
  signUpThrough: string;
  profileImage?: IFile;
  EmailVerifiedOTP?: string;
  EmailVerifiedOTPExpiredAt?: Date;
  isEmailVerified: boolean;
  EmailVerifiedAt: Date;
  userType: Types.ObjectId;
  supplierCategory: Types.ObjectId;
  additionalAccessRights: string[];
  restrictedAccessRights: string[];
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  isBlocked: boolean;
  documents: IFile;
  // isSupplier: boolean;
}



export type UserCreatePayload = Pick<IUser , "firstName" | "lastName" | "email" | "password" | "signUpThrough" | "phoneNumber" | "userType" | "additionalAccessRights" | "restrictedAccessRights">
export type UserSignupPayload = Pick<IUser , "firstName" | "lastName" | "email" | "password" | "signUpThrough">

export interface IUserMethods {
  comparePassword: (password: string) => boolean;
  hashPassword: (password: string) => string;
}


export type UserModel = Model<IUser, unknown, IUserMethods>;
