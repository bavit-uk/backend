import { Document, Model, Types } from "mongoose";


export interface IUserCategory extends Document {
    _id: Types.ObjectId;
    userType: string;
    description?: string;
    permissions: string[];
}


export type UserCategoryModel = Model<IUserCategory>;
