import { PaymentPolicy } from "@/models";

export const paymentPolicyService = {
  createPaymentPolicy: (data: {policyName: string , policyDescription: string , immediatePayment: boolean , cashOnPickUp: boolean }) => {
    const {policyName , policyDescription , immediatePayment , cashOnPickUp} = data
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

  toggleBlock: async (id: string, isBlocked: boolean) => {
    console.log("block : " , isBlocked)
    console.log("id : " , id)
    const updatedCategory = await PaymentPolicy.findByIdAndUpdate(id, { isBlocked: isBlocked }, { new: true });
    if (!updatedCategory) {
      throw new Error("Policy not found");
    }
    return updatedCategory;
  },

};
