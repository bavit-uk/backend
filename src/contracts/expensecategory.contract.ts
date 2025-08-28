import { Model, Document } from "mongoose";

export interface IExpenseCategory extends Document {
    title: string, 
    description: string, 
    image?: string,
    isBlocked: boolean,
    isSystemGenerated: boolean,
}

export type IExpenseCategoryModel = Model<IExpenseCategory>


