import { IProductCategory, ProductCategoryModel } from "@/contracts/product-category.contract";
import {Schema , model } from "mongoose";


const productCategorySchema = new Schema<IProductCategory , ProductCategoryModel>(
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      image: { type: [String], default: [] },
      isBlocked: { type: Boolean, default: false },
    },
    {
      timestamps: true,
    }
);

export const ProductCategory = model<IProductCategory , ProductCategoryModel>('ProductCategory', productCategorySchema);