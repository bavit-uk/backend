import { Document, Model, Types } from "mongoose";


export interface IUserCategory extends Document {
  _id: Types.ObjectId;
  userType: string;
  description?: string;
  permissions: string[];
}


export interface IUser extends Document {
  firstName: string;
  lastName?: string;
  email: string;
  password?: string;
  signUpThrough: string;
  profileImage: string;
  EmailVerifiedOTP?: string;
  EmailVerifiedOTPExpiredAt?: Date;
  isEmailVerified: boolean;
  EmailVerifiedAt: Date;
  userType: IUserCategory | Types.ObjectId;
  additionalAccessRights: string[];
  restrictedAccessRights: string[];
  phoneNumber: string;
}


export interface IUserMethods {
  comparePassword: (password: string) => boolean;
  hashPassword: (password: string) => string;
}


export type UserModel = Model<IUser, unknown, IUserMethods>;
