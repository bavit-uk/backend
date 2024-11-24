import { getZodErrors } from "@/utils/get-zod-errors.util";
import { NextFunction, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { z, ZodSchema } from "zod";
import { Types } from "mongoose";
import { IBodyRequest } from "@/contracts/request.contract";
import { supplierAddPayload } from "@/contracts/supplier.contract";
import { REGEX } from "@/constants/regex";

// Custom Zod validation for MongoDB ObjectId
const objectId = z.instanceof(Types.ObjectId).or(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"));

// Address validation schema
const addressSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
  isDefault: z.boolean().optional(),
});

// Document validation schema
const documentSchema = z.object({
  originalname: z.string().trim().min(1, "Original name is required"),
  encoding: z.string().optional(),
  mimetype: z.string().optional(),
  size: z.number().positive("Size must be a positive number").optional(),
  url: z.string().url("Invalid URL format").optional(),
  filename: z.string().trim().min(1, "Filename is required").optional(),
});


export const supplierValidation = {

  addSupplier: async (req: IBodyRequest<supplierAddPayload>, res: Response, next: NextFunction) => {
    const schema: ZodSchema = z.object({
      firstName: z.string().trim().min(3, "First name is required"),
      lastName: z.string().trim().min(3, "Last name is required"),
      email: z.string().trim().min(3, "Email is required").regex(REGEX.EMAIL, "Invalid email format"),
      password: z.string().regex(REGEX.PASSWORD, "(A-Z) (a-z) (0-9) (one charcter) (between 8-20)"),
      phoneNumber: z.string().trim().min(3, "Phone number is required"),
      address: z.array(addressSchema).min(1, "At least one address is required"),
      documents: z.array(documentSchema).optional(),
      //   userType: objectId, // Reference to UserCategory
      supplierCategory: objectId,
    });
    try {
      const validatedData = schema.parse(req.body);
      Object.assign(req.body, validatedData);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const { message, issues } = getZodErrors(error);

        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: message,
          issues: issues,
        });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }
    }
  },

   // ID validation 
   validateId: (req: IBodyRequest<string>, res: Response, next: NextFunction) => {
    const schema = z.object({
      id: objectId,
    });
    try {
      const validatedData = schema.parse(req.params);
      Object.assign(req.params, validatedData);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const { message, issues } = getZodErrors(error);
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: message,
          issues: issues,
        });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }
    }
  },

};
