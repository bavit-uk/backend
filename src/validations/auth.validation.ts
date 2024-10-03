import { ENUMS } from "@/constants/enum";
import { REGEX } from "@/constants/regex";
import { SignInPayload, SignInWithQRPayload, SignUpPayload } from "@/contracts/auth.contract";
import { IBodyRequest, ICombinedRequest, IUserRequest } from "@/contracts/request.contract";
import { IUser, UserUpdatePayload } from "@/contracts/user.contract";
import { getZodErrors } from "@/utils/get-zod-errors.util";
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
      password: z.string({
        message: "Password is required but it was not provided",
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

  signInWithQrCode: async (req: IBodyRequest<SignInWithQRPayload>, res: Response, next: NextFunction) => {
    const schema: ZodSchema<SignInWithQRPayload> = z.object({
      loginQRCode: z.string({ message: "QR code is required but it was not provided" }),
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

  updateProfile: async (req: ICombinedRequest<IUserRequest, UserUpdatePayload>, res: Response, next: NextFunction) => {
    const schema: ZodSchema<{
      name: string;
      dob: string;
      mobileNumber: string;
      countryCode: string;
      countryCodeName: string;
      bio?: string;
    }> = z.object({
      name: z
        .string({
          message: "Name is required but it was not provided",
        })
        .min(3, { message: "Name must be at least 3 characters long" }),
      dob: z.string({
        message: "Date of birth is required but it was not provided",
      }),
      mobileNumber: z.string({
        message: "Mobile number is required but it was not provided",
      }),
      countryCode: z.string({
        message: "Country code is required but it was not provided",
      }),
      countryCodeName: z.string({
        message: "Country code name is required but it was not provided",
      }),
      bio: z
        .string({
          message: "Bio is required but it was not provided",
        })
        .optional(),
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

  verifyOtp: async (req: IBodyRequest<{ email: string; otp: number }>, res: Response, next: NextFunction) => {
    const schema: ZodSchema<{ email: string; otp: number }> = z.object({
      email: z
        .string({
          message: "Email is required but it was not provided",
        })
        .regex(REGEX.EMAIL, { message: "Invalid email format" })
        .toLowerCase(),
      otp: z.number({
        message: "OTP is required but it was not provided",
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

  resetPassword: async (
    req: ICombinedRequest<
      IUserRequest,
      {
        email: string;
        newPassword: string;
      }
    >,
    res: Response,
    next: NextFunction
  ) => {
    const schema: ZodSchema<{ email: string; newPassword: string }> = z.object({
      email: z
        .string({
          message: "Email is required but it was not provided",
        })
        .regex(REGEX.EMAIL, { message: "Invalid email format" })
        .toLowerCase(),

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
  requestEmailVerification: async (
    req: IBodyRequest<{
      email: string;
    }>,
    res: Response,
    next: NextFunction
  ) => {
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

  verifyEmail: async (req: IBodyRequest<{ email: string; otp: number }>, res: Response, next: NextFunction) => {
    const schema: ZodSchema<{ email: string; otp: number }> = z.object({
      email: z
        .string({
          message: "Email is required but it was not provided",
        })
        .regex(REGEX.EMAIL, { message: "Invalid email format" })
        .toLowerCase(),
      otp: z.number({
        message: "OTP is required but it was not provided",
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

  modifyLoginStatus: async (
    req: ICombinedRequest<IUserRequest, Pick<IUser, "loginWithQRCode">>,
    res: Response,
    next: NextFunction
  ) => {
    const schema: ZodSchema<Pick<IUser, "loginWithQRCode">> = z.object({
      loginWithQRCode: z.boolean({
        message: "Login status is required but it was not provided",
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
};
