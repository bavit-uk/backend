import { Document, Types, Model } from "mongoose";

export enum ContractType {
  HOURLY = "hourly",
  MONTHLY = "monthly",
}

interface DeductionAllowance {
  name: string;
  value: number;
  type: "rate" | "amount";
}

export interface PayrollDocument extends Document {
  category: Types.ObjectId;
  userId: Types.ObjectId;
  contractType: ContractType;
  baseSalary?: number;
  hourlyRate?: number;
  deductions: DeductionAllowance[];
  allowances: DeductionAllowance[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollModel extends Model<PayrollDocument> {}
