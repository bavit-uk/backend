import { Document, Model, Types } from "mongoose";
import { IFile, IUser } from "./user.contract";

export type supplierAddPayload = Pick<
  IUser,
  "firstName" | "lastName" | "email" | "password" | "phoneNumber" | "address" | "supplierCategory" | "documents"
>;

