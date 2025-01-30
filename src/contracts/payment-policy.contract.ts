import { Document, Model, Types } from "mongoose";

export interface IPaymentPolicy extends Document {
    policyName: string;
    policyDescription: string;
    immediatePayment: boolean;
    cashOnPickUp: boolean;
    isBlocked: boolean;
}

export type PaymentPolicyModel = Model<IPaymentPolicy>;

