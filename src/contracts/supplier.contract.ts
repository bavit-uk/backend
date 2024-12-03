import { Document, Model, Types } from "mongoose";
import { IFile, IUser } from "./user.contract";
import { IUserAddress } from "./user-address.contracts";

export type supplierAddPayload = Pick<
  IUser,
  "firstName" | "lastName" | "email" | "password" | "phoneNumber" | "supplierCategory" | "userType" | "documents"
> & { address: IUserAddress };



