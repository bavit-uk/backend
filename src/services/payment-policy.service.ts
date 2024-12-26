import { PaymentPolicy } from "@/models";

export const paymentPolicyService = {
  createPaymentPolicy: (
    policyName: string,
    policyDescription: string,
    immediatePayment: boolean,
    cashOnPickUp: boolean
  ) => {
    const paymentPolicy = new PaymentPolicy({
      policyName,
      policyDescription,
      immediatePayment,
      cashOnPickUp,
    });
    return paymentPolicy.save();
  },

  getAllPaymentPolicies: () => {
    return PaymentPolicy.find();
  },

  getById: (id: string) => {
    return PaymentPolicy.findById(id);
  },

  editPolicy: (
    id: string,
    data: { policyName?: string; policyDescription?: string; immediatePayment?: boolean; cashOnPickUp?: boolean }
  ) => {
    return PaymentPolicy.findByIdAndUpdate(id, data, { new: true });
  },

  deletePolicy: (id: string) => {
    const policy = PaymentPolicy.findByIdAndDelete(id);
    if (!policy) {
      throw new Error("policy not found");
    }
    return policy;
  },
  
};
