import { Model, ObjectId } from "mongoose";

export interface IPasswordReset {
  id: ObjectId;
  email: string;
  token: string;
  expireAt: Date;
  isUsed: boolean;
}

interface UpdatePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export type PasswordResetPayload = Pick<IPasswordReset, "email">;

export type PasswordUpdatePayload = Pick<IPasswordReset, "token"> & Pick<UpdatePasswordPayload, "newPassword">;

export type PasswordResetModel = Model<IPasswordReset, unknown>;
