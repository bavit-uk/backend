import { getZodErrors } from "@/utils/get-zod-errors.util";
import { NextFunction, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { z, ZodSchema } from "zod";
import { Types } from "mongoose";
import { IBodyRequest } from "@/contracts/request.contract";
import { REGEX } from "@/constants/regex";
import { IUserCategory } from "@/contracts/user-category.contract";


// Custom Zod validation for MongoDB ObjectId
const objectId = z.instanceof(Types.ObjectId).or(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"));


export const userCategoryValidation = {

    createUserCategory: async (req: IBodyRequest<IUserCategory> , res: Response , next: NextFunction ) => {
        const schema: ZodSchema = z.object({
            userType: z.string().min(3, "User type is required"), // userType is required
            description: z.string().optional(), // description is optional
            permissions: z.array(z.string()).min(1, "At least one permission is required"), // permissions array must have at least one string
        })
        try {
            const validatedData = schema.parse(req.body);
            Object.assign(req.body , validatedData);
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

}


