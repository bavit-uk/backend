import { user } from "./../routes/user.route";
import { SignUpPayload } from "./../contracts/auth.contract";
import { passwordResetService, userService } from "@/services";
import { request, Response } from "express";
import { IBodyRequest, ICombinedRequest, IContextRequest, IUserRequest } from "@/contracts/request.contract";
import { SignInPayload } from "@/contracts/auth.contract";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { jwtSign } from "@/utils/jwt.util";
import { createHash } from "@/utils/hash.util";
import { PasswordReset } from "@/models";
import crypto from "crypto";
import { PasswordResetPayload, PasswordUpdatePayload } from "@/contracts/password-reset.contract";
import { comparePassword } from "@/utils/compare-password.util";

import formData from "form-data";
import Mailgun from "mailgun.js";
import { verify } from "jsonwebtoken";
import { sendEmail } from "@/utils/send-email.util";
import { UserUpdatePayload } from "@/contracts/user.contract";

export const authController = {
  signIn: async (req: ICombinedRequest<unknown, SignInPayload, unknown, { dashboard?: boolean }>, res: Response) => {
    try {
      const { email, password } = req.body;
      const { dashboard } = req.query;

      const user = await userService.getByEmail(email, "+password");
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }
      if (!user.comparePassword(password)) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: ReasonPhrases.UNAUTHORIZED,
          status: StatusCodes.UNAUTHORIZED,
        });
      }

      if (dashboard && user.role !== "admin") {
        return res.status(StatusCodes.PRECONDITION_FAILED).json({
          message: ReasonPhrases.PRECONDITION_FAILED,
          status: StatusCodes.PRECONDITION_FAILED,
        });
      }

      const { accessToken, refreshToken } = jwtSign(user.id);
      return res.status(StatusCodes.OK).json({
        data: { accessToken, refreshToken, user: user.toJSON() },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },

  signUp: async ({ body: { email, password, name, role } }: IBodyRequest<SignUpPayload>, res: Response) => {
    try {
      const exists = await userService.getByEmail(email);
      if (exists) {
        return res.status(StatusCodes.CONFLICT).json({
          message: ReasonPhrases.CONFLICT,
          status: StatusCodes.CONFLICT,
        });
      }

      const hash = await createHash(password);

      const otp = Math.floor(10000 + Math.random() * 90000).toString();

      await userService.create({ email, password: hash, name, otp });

      // TODO: Send email verification code with otp and time to expire

      return res.status(StatusCodes.CREATED).json({
        message: ReasonPhrases.CREATED,
        status: StatusCodes.CREATED,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },

  refreshToken: async ({ context: { user } }: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const { accessToken } = jwtSign(user.id);

      return res.status(StatusCodes.OK).json({
        data: { accessToken },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },

  updateProfile: async (req: ICombinedRequest<IUserRequest, UserUpdatePayload>, res: Response) => {
    try {
      const { name, email, countryCode, countryCodeName, mobileNumber, dob, bio } = req.body;
      const { user } = req.context;

      if (email !== user.email) {
        const exists = await userService.getByEmail(email as string);
        if (exists) {
          return res.status(StatusCodes.CONFLICT).json({
            message: ReasonPhrases.CONFLICT,
            status: StatusCodes.CONFLICT,
          });
        }
      }

      await userService.updateProfileByUserId(user.id, {
        name,
        email,
        dob,
        countryCode,
        countryCodeName,
        mobileNumber,
        bio,
      });

      return res.status(StatusCodes.OK).json({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },

  forgotPassword: async ({ body: { email } }: IBodyRequest<PasswordResetPayload>, res: Response) => {
    try {
      const user = await userService.getByEmail(email);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      await passwordResetService.updateAllUnusedPasswordResetsToUsed(email);

      // Genearte 5 digit OTP
      const token = Math.floor(10000 + Math.random() * 90000).toString();

      // Expire time for password reset token (1 hour)
      const EXPIRY_TIME = 1000 * 60 * 60;

      // TODO: Send email with generated OTP

      await passwordResetService.createPasswordReset({
        email: user.email,
        token,
        expireAt: new Date(Date.now() + EXPIRY_TIME),
      });

      const html = `
        <h1>Reset your password</h1>
        <p>Hello ${user.name},</p>
        <p>Bellow is your password reset token. Please use it to reset your password.</p>
        <p><strong>${token}</strong></p>
        <p>This token will expire in 1 hour.</p>
        <p>Thanks</p>
      `;

      await sendEmail(user.email, "QR Exchange Support: Password Reset", "Password Reset", html);

      // Send email with reset password link
      return res.status(StatusCodes.OK).json({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
        // token,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },

  verifyOtp: async (req: IBodyRequest<{ email: string; otp: number }>, res: Response) => {
    try {
      const { email, otp } = req.body;

      const user = await userService.getByEmail(email);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      const reset = await passwordResetService.findPasswordResetByEmailAndToken(email, otp.toString());
      if (!reset) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      if (reset.isUsed || reset.expireAt < new Date()) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: ReasonPhrases.UNAUTHORIZED,
          status: StatusCodes.UNAUTHORIZED,
        });
      }

      await userService.updateProfileByUserId(user.id, {
        allowResetPassword: true,
      });

      return res.status(StatusCodes.OK).json({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },

  resetPassword: async ({ body: { email, newPassword } }: IBodyRequest<PasswordUpdatePayload>, res: Response) => {
    try {
      const user = await userService.getByEmail(email);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      if (!user.allowResetPassword) {
        return res.status(StatusCodes.PRECONDITION_FAILED).json({
          message: ReasonPhrases.PRECONDITION_FAILED,
          status: StatusCodes.PRECONDITION_FAILED,
        });
      }

      const hash = await createHash(newPassword);

      await userService.updatePasswordByUserId(user.id, hash);

      return res.status(StatusCodes.OK).json({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },

  me: async ({ context: { user } }: IContextRequest<IUserRequest>, res: Response) => {
    try {
      return res.status(StatusCodes.OK).json({
        data: { user },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
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
    res: Response
  ) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const { user } = req.context;

      if (!comparePassword(oldPassword, user.password)) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: ReasonPhrases.UNAUTHORIZED,
          status: StatusCodes.UNAUTHORIZED,
        });
      }

      const hash = await createHash(newPassword);

      await userService.updatePasswordByUserId(user.id, hash);

      return res.status(StatusCodes.OK).json({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },

  requestEmailVerification: async (req: ICombinedRequest<null, { email: string }>, res: Response) => {
    try {
      const { email } = req.body;

      const user = await userService.getByEmail(email);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      if (user.emailVerified) {
        return res.status(StatusCodes.OK).json({
          message: ReasonPhrases.OK,
          status: StatusCodes.OK,
        });
      }

      const otp = Math.floor(10000 + Math.random() * 90000);

      await userService.updateEmailVerificationOtp(user.id, otp);

      // TODO: Send email with OTP

      return res.status(StatusCodes.OK).json({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
        otp,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },

  verifyEmail: async (
    req: IBodyRequest<{
      email: string;
      otp: number;
    }>,
    res: Response
  ) => {
    try {
      const { email, otp } = req.body;

      const foundUser = await userService.getByEmail(email, "+otp +otpExpiresAt +emailVerified");

      console.log(foundUser);

      if (!foundUser) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      if (foundUser.emailVerified) {
        return res.status(StatusCodes.OK).json({
          message: ReasonPhrases.OK,
          status: StatusCodes.OK,
        });
      }

      if (!foundUser.otp || !foundUser.otpExpiresAt) {
        console.log("OTP not found");
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }

      const matchedToken = foundUser.otp.toString() === otp.toString() && foundUser.otpExpiresAt > new Date();
      if (!matchedToken) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: ReasonPhrases.UNAUTHORIZED,
          status: StatusCodes.UNAUTHORIZED,
        });
      }

      await userService.updateEmailVerificationStatus(foundUser.id, true);

      return res.status(StatusCodes.OK).json({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },
};
