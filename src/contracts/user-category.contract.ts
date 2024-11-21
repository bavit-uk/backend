import { Document, Model, Types } from "mongoose";


export interface IUserCategory extends Document {
    _id: Types.ObjectId;
    role: string;
    description?: string;
    permissions: string[];
    isSupplier: boolean;
}


export type UserCategoryModel = Model<IUserCategory>;
