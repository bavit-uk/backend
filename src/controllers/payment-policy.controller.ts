import { paymentPolicyService } from "@/services";
import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

export const paymentPolicyController = {
  createPaymentPolicy: async (req: Request, res: Response) => {
    try {
      const { policyName, policyDescription, immediatePayment, cashOnPickUp } = req.body;
      console.log(policyName, policyDescription, immediatePayment, cashOnPickUp);

      const paymentPolicy = await paymentPolicyService.createPaymentPolicy(
        policyName,
        policyDescription,
        immediatePayment,
        cashOnPickUp
      );

      res.status(StatusCodes.CREATED).json({
        message: "Payment policy created successfully",
        paymentPolicy: paymentPolicy,
      });
    } catch (error: any) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating payment policy" });
    }
  },

  getAllPaymentPolicy: async (req: Request, res: Response) => {
    try {
      // console.log("Hello")
      const paymentPolicies = await paymentPolicyService.getAllPaymentPolicies();
      res.status(StatusCodes.OK).json(paymentPolicies);
    } catch (error: any) {
      console.log(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error fetching payment policies", error: error });
    }
  },

  getSpecificPolicy: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const result = await paymentPolicyService.getById(id);
      if (!result) return res.status(404).json({ message: "Policy not found" });
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      console.error("View Policy Error:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error getting policy" });
    }
  },

  editPolicy: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { policyName, policyDescription, immediatePayment, cashOnPickUp } = req.body;
      const policy = await paymentPolicyService.editPolicy(id, {
        policyName,
        policyDescription,
        immediatePayment,
        cashOnPickUp,
      });
      res.status(StatusCodes.OK).json({ success: true, message: "Policy updated successfully", data: policy });
    } catch (error) {
      console.error("Edit Policy Error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error updating policy" });
    }
  },

  deletePolicy: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await paymentPolicyService.deletePolicy(id);
      res.status(StatusCodes.OK).json({ success: true, message: "Policy deleted successfully", deletedPolicy: result });
    } catch (error) {
      console.error("Delete Policy Error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error deleting policy" });
    }
  },

};
