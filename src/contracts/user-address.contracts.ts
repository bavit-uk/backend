import { Document, Model, Types } from "mongoose";


export interface IUserAddress extends Document {
    userId: Types.ObjectId;
    label: string;
    street: string,
    city: string,
    state: string,
    postalCode: string,
    country: string;
    isDefault: boolean
}

export type UserAddressModel = Model<IUserAddress>;