import { ENUMS } from "@/constants/enum";
import { REGEX } from "@/constants/regex";
import { SignInPayload, SignUpPayload } from "@/contracts/auth.contract";
import { IBodyRequest, ICombinedRequest, IUserRequest } from "@/contracts/request.contract";
import { getZodErrors } from "@/utils/get-zod-errors";
import { NextFunction, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { z, ZodSchema } from "zod";

export const authValidation = {
  signIn: async (req: IBodyRequest<SignInPayload>, res: Response, next: NextFunction) => {
    const schema: ZodSchema<SignInPayload> = z.object({
      email: z
        .string({
          message: "Email is required but it was not provided",
        })
        .regex(REGEX.EMAIL, { message: "Invalid email format" })
        .toLowerCase(),
      password: z
        .string({
          message: "Password is required but it was not provided",
        })
        .regex(REGEX.PASSWORD, {
          message: "Password must contain at least 8 characters, including uppercase, lowercase letters and numbers",
        }),
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

  signUp: async (req: IBodyRequest<SignUpPayload>, res: Response, next: NextFunction) => {
    const schema: ZodSchema<SignUpPayload> = z.object({
      email: z
        .string({
          message: "Email is required but it was not provided",
        })
        .regex(REGEX.EMAIL, { message: "Invalid email format" })
        .toLowerCase(),
      name: z
        .string({
          message: "Name is required but it was not provided",
        })
        .min(3, { message: "Name must be at least 3 characters long" }),
      password: z
        .string({
          message: "Password is required but it was not provided",
        })
        .regex(REGEX.PASSWORD, {
          message: "Password must contain at least 8 characters, including uppercase, lowercase letters and numbers",
        }),
      role: z.enum(ENUMS.USER_TYPES, { message: "Invalid role" }).optional(),
    });

    try {
      const validatedData = schema.parse(req.body);

      Object.assign(req.body, validatedData);

      next();
    } catch (error: any) {
      console.log(error);
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

  forgotPassword: async (req: IBodyRequest<{ email: string }>, res: Response, next: NextFunction) => {
    const schema: ZodSchema<{ email: string }> = z.object({
      email: z
        .string({
          message: "Email is required but it was not provided",
        })
        .regex(REGEX.EMAIL, { message: "Invalid email format" })
        .toLowerCase(),
    });

    try {
      const validatedData = schema.parse(req.body);

      console.log(validatedData);

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

  resetPassword: async (
    req: ICombinedRequest<
      IUserRequest,
      {
        email: string;
        token: string;
        newPassword: string;
      }
    >,
    res: Response,
    next: NextFunction
  ) => {
    const schema: ZodSchema<{ email: string; token: string; newPassword: string }> = z.object({
      email: z
        .string({
          message: "Email is required but it was not provided",
        })
        .regex(REGEX.EMAIL, { message: "Invalid email format" })
        .toLowerCase(),
      token: z.string({
        message: "Token is required but it was not provided",
      }),
      newPassword: z
        .string({
          message: "New password is required but it was not provided",
        })
        .regex(REGEX.PASSWORD, {
          message:
            "New password must contain at least 8 characters, including uppercase, lowercase letters and numbers",
        }),
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

  updatePassword: async (
    req: ICombinedRequest<
      IUserRequest,
      {
        oldPassword: string;
        newPassword: string;
      }
    >,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const issues = [];

      if (!req.body.oldPassword) {
        issues.push("Old password is required but it was not provided");
      }

      if (!req.body.newPassword) {
        issues.push("New password is required but it was not provided");
      } else {
        const validate = REGEX.PASSWORD.test(req.body.newPassword);
        if (!validate) {
          issues.push(
            "New password must contain at least 8 characters, including uppercase, lowercase letters and numbers"
          );
        }
      }

      if (issues.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: issues.join(", "),
          issues: issues,
        });
      }

      next();
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }
  },
};
