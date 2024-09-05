import { Model, ObjectId } from "mongoose";

export interface IUser {
  id: ObjectId;
  name: string;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  password: string;
  passwordResetAt?: Date;
  role: "user" | "admin";
}

export interface IUserMethods {
  comparePassword: (password: string) => boolean;
  hashPassword: (password: string) => string;
}

export type UserCreatePayload = Pick<IUser, "name" | "email" | "password" | "role">;

export type UserUpdatePayload = Partial<UserCreatePayload>;

export type UserModel = Model<IUser, unknown, IUserMethods>;

export type ResetPasswordPayload = Pick<IUser, "email">;
