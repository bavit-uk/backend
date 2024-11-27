import { getZodErrors } from "@/utils/get-zod-errors.util";
import { NextFunction, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { z, ZodSchema } from "zod";
import { IUser  , UserCreatePayload, UserUpdatePayload} from "@/contracts/user.contract";
import { Types } from "mongoose";
import { IBodyRequest } from "@/contracts/request.contract";
import { REGEX } from "@/constants/regex";
import { ENUMS } from "@/constants/enum";

// Custom Zod validation for MongoDB ObjectId
const objectId = z.instanceof(Types.ObjectId).or(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"));

export const userValidation = {
  // create new user validation
  createUser: async (req: IBodyRequest<UserCreatePayload>, res: Response, next: NextFunction) => {

      // Define the address schema
  const addressSchema = z.object({
    userId: z.string().optional(), 
    label: z.string().trim().min(3, "Address label must be at least 3 characters").optional(),
    street: z.string().trim().min(3, "Street must be at least 3 characters").optional(),
    city: z.string().trim().min(2, "City must be at least 2 characters").optional(),
    state: z.string().trim().min(2, "State must be at least 2 characters").optional(),
    postalCode: z.string().trim().optional(),
    country: z.string().trim().min(2, "Country must be at least 2 characters").optional(),
    isDefault: z.boolean().optional(),
  })

    const schema: ZodSchema = z.object({
      firstName: z.string().trim().min(3, "First name is required"),
      lastName: z.string().trim().min(3, "Last name is required"),
      email: z.string().trim().min(3, "Email is required").regex(REGEX.EMAIL, "Invalid email format"),
      password: z.string().regex(REGEX.PASSWORD, "(A-Z) (a-z) (0-9) (one charcter) (between 8-20)"),
      additionalAccessRights: z.array(z.string()).optional(),
      restrictedAccessRights: z.array(z.string()).optional(),
      phoneNumber: z.string().trim().min(3, "Phone number is required"),
      dob: z.string().optional(),
      // userType: z.objectId(),
      address: z.array(addressSchema).optional()
      
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

  // update user validation
  updateUser: async (req: IBodyRequest<UserUpdatePayload>, res: Response, next: NextFunction) => {
    // Create a partial schema for updates
    const schema: ZodSchema = z.object({
      firstName: z.string().min(3, "First name is required").optional(),
      lastName: z.string().min(3, "Last name is required").optional(),
      email: z.string().regex(REGEX.EMAIL, "Invalid email format").optional(),
      password: z.string().regex(REGEX.PASSWORD, "(A-Z) (a-z) (0-9) (one character) (between 8-20)").optional(),
      signUpThrough: z.enum(["Google", "Apple", "Web"]).optional(),
      profileImage: z.string().optional(),
      EmailVerifiedOTP: z.string().optional(),
      EmailVerifiedOTPExpiredAt: z.date().optional(),
      isEmailVerified: z.boolean().optional(),
      EmailVerifiedAt: z.date().optional(),
      userType: objectId.optional(), // Reference to UserCategory
      additionalAccessRights: z.array(z.string()).optional(),
      restrictedAccessRights: z.array(z.string()).optional(),
      phoneNumber: z.string().optional(),
      dob: z.string().optional()
    }).partial(); // Use `.partial()` to allow partial updates
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

  // ID validation for get/delete 
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
