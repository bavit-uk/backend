import { ENUMS } from "@/constants/enum";
import { REGEX } from "@/constants/regex";
import { SignInPayload, SignUpPayload } from "@/contracts/auth.contract";
import { IBodyRequest, ICombinedRequest, IUserRequest } from "@/contracts/request.contract";
import { NextFunction, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

export const authValidation = {
  signIn: async (req: IBodyRequest<SignInPayload>, res: Response, next: NextFunction) => {
    try {
      const issues = [];

      if (!req.body.email) {
        issues.push("Email is required but it was not provided");
      }

      if (!req.body.password) {
        issues.push("Password is required but it was not provided");
      }

      if (issues.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: issues.join(", "),
          issues,
        });
      }

      let email = req.body.email;
      email = email.trim().toLowerCase();

      Object.assign(req.body, { email });

      next();
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }
  },

  signUp: async (req: IBodyRequest<SignUpPayload>, res: Response, next: NextFunction) => {
    try {
      const issues = [];

      if (!req.body.email) {
        issues.push("Email is required but it was not provided");
      } else {
        const validate = REGEX.EMAIL.test(req.body.email);
        if (!validate) {
          issues.push("Provided email is not valid");
        }
      }

      if (!req.body.password) {
        issues.push("Password is required but it was not provided");
      } else {
        const validate = REGEX.PASSWORD.test(req.body.password);
        if (!validate) {
          issues.push(
            "Password must contain at least 8 characters, including uppercase, lowercase letters and numbers"
          );
        }
      }

      if (!req.body.name) {
        issues.push("Name is required but it was not provided");
      } else {
        const validate = REGEX.NAME.test(req.body.name);
        if (!validate) {
          issues.push("Name must contain only letters");
        }
      }

      if (!req.body.role) {
        req.body.role = "user";
      } else {
        if (!ENUMS.USER_TYPES.includes(req.body.role)) {
          issues.push("Role is not valid");
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

      let email = req.body.email;
      email = email.trim().toLowerCase();

      Object.assign(req.body, { email });

      next();
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }
  },

  forgotPassword: async (req: IBodyRequest<{ email: string }>, res: Response, next: NextFunction) => {
    try {
      const issues = [];

      if (!req.body.email) {
        issues.push("Email is required but it was not provided");
      } else {
        const validate = REGEX.EMAIL.test(req.body.email);
        if (!validate) {
          issues.push("Provided email is not valid");
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

      let email = req.body.email;
      email = email.trim().toLowerCase();

      Object.assign(req.body, { email });

      next();
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
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
