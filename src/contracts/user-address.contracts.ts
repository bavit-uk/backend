import { Document, Model, Types } from "mongoose";

export interface IUserAddress extends Document {
  userId: Types.ObjectId;
  country: string;
  address: string;
  county: string;
  appartment: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
  isActive: boolean;
  longitude: number;
  latitude: number;
}

export type UserAddressModel = Model<IUserAddress>;
