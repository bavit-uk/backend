import { Document, Model, Types } from "mongoose";

// Interface for Product Category
export interface IProductCategory extends Document {
  name: string;
  description: string;
  image?: string[];
  tags?: string[];
  isBlocked?: boolean;
}

export type ProductCategoryModel = Model<IProductCategory>;

export type ProductCategoryCreatePayload = Pick<IProductCategory, "name" | "description" | "image" | "isBlocked" | "tags">;

export type ProductCategoryUpdatePayload = Partial<ProductCategoryCreatePayload>

