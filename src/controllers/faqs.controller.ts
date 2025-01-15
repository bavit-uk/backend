import { faqsPolicyService } from "@/services/faqs-policy.service";
import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";



export const faqsPolicyController = {
    createFaqsPolicy: async (req: Request, res: Response) => {
        try {
          const faqsPolicy = await faqsPolicyService.createFaqsPolicy(req.body);
    
          res.status(StatusCodes.CREATED).json({
            message: "Faqs policy created successfully",
            faqsPolicy: faqsPolicy,
          });
        } catch (error: any) {
          console.error(error);
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating faqs policy" });
        }
      },
} 