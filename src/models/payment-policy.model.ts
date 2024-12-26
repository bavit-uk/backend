import mongoose, { Schema, model , Document } from "mongoose";
import { IPaymentPolicy , PaymentPolicyModel } from "@/contracts/payment-policy.contract";

const paymentPolicySchema = new Schema<IPaymentPolicy> ({
    policyName: { type: String, required: true },
    policyDescription: { type: String, required: true },
    immediatePayment: { type: Boolean },
    cashOnPickUp: { type: Boolean }
}, {timestamps: true})

export const PaymentPolicy = model<IPaymentPolicy , PaymentPolicyModel>('PaymentPolicy' , paymentPolicySchema)