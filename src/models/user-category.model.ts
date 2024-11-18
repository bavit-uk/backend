import mongoose, { Schema, model , Document } from "mongoose";
import { IUserCategory , UserCategoryModel } from "@/contracts/user-category.contract";


const userCategorySchema = new Schema<IUserCategory>({
    userType: { type: String, required: true, unique: true },
    description: { type: String },
    permissions: { type: [String], required: true }, 
}, { timestamps: true });

export const UserCategory = model<IUserCategory , UserCategoryModel>('UserCategory', userCategorySchema);