import { SignInPayload, SignInWithQRPayload } from "@/contracts/auth.contract";
import { PasswordResetPayload, PasswordUpdatePayload } from "@/contracts/password-reset.contract";
import { IBodyRequest, ICombinedRequest, IContextRequest, IUserRequest } from "@/contracts/request.contract";
import { conversationService, messageService, passwordResetService, userService } from "@/services";
import { comparePassword } from "@/utils/compare-password.util";
import { createHash } from "@/utils/hash.util";
import { jwtSign } from "@/utils/jwt.util";
import { Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { SignUpPayload } from "./../contracts/auth.contract";

import { IUser, UserUpdatePayload } from "@/contracts/user.contract";
import { generateOTP } from "@/utils/generate-otp.util";
import { sendEmail } from "@/utils/send-email.util";
import { decryptLoginQR, generateLoginQR } from "@/utils/generate-login-qr.util";
import mongoose from "mongoose";

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

      if (user.deviceUniqueId && user.deviceUniqueId !== req.headers["device-unique-id"]) {
        const token = generateOTP(5);

        const html = `
        <h1>Login OTP</h1>
        <p>Hello ${user.name},</p>
        <p>Below is your Login OTP. Please use it to complete your login process.</p>
        <p><strong>${token}</strong></p>
        <p>This token will expire in 1 hour.</p>
        <p>Thanks</p>
      `;

        await sendEmail(user.email, "QR Exchange Support: Login OTP", "Login OTP", html);
        await userService.updateLoginVerificationOtp(user.id, token);
        return res.status(StatusCodes.OK).json({
          message: ReasonPhrases.OK,
          status: StatusCodes.OK,
          reason: "DEVICE_ID_MISMATCH",
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

  signInWithQrCode: async (
    req: ICombinedRequest<unknown, SignInWithQRPayload, unknown, { dashboard?: boolean }>,
    res: Response
  ) => {
    try {
      const { loginQRCode } = req.body;
      const { dashboard } = req.query;
      let qrCode;

      try {
        qrCode = decryptLoginQR(loginQRCode!);
      } catch (err) {
        console.log(err);
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: ReasonPhrases.UNAUTHORIZED,
          status: StatusCodes.UNAUTHORIZED,
        });
      }
      const user = await userService.getByLoginQRCode(qrCode);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      if (!user.loginWithQRCode) {
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

  signInWithOtp: async (req: IBodyRequest<Pick<SignInPayload, "email" | "otp" | "deviceUniqueId">>, res: Response) => {
    try {
      const { email, otp, deviceUniqueId } = req.body;

      const user = await userService.getByEmail(email, "+otp +otpExpiresAt");
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      if (!user.otp || !user.otpExpiresAt) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }

      const matchedToken = user.otp.toString() === otp!.toString() && user.otpExpiresAt > new Date();
      if (!matchedToken) {
        console.log("OTP Mismatch");
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: ReasonPhrases.UNAUTHORIZED,
          status: StatusCodes.UNAUTHORIZED,
        });
      }

      await userService.updateLoginVerificationOtp(user.id, null);
      await userService.updateUniqueDeviceId(user.id, deviceUniqueId!);

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

  resendLoginOtp: async (req: IBodyRequest<{ email: string }>, res: Response) => {
    try {
      const { email } = req.body;

      const user = await userService.getByEmail(email, "+otp +otpExpiresAt");
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      if (!user.otp || !user.otpExpiresAt) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }

      const token = generateOTP(5);

      const html = `
        <h1>Login OTP</h1>
        <p>Hello ${user.name},</p>
        <p>Below is your Login OTP. Please use it to complete your login process.</p>
        <p><strong>${token}</strong></p>
        <p>This token will expire in 1 hour.</p>
        <p>Thanks</p>
      `;

      await sendEmail(user.email, "QR Exchange Support: Login OTP", "Login OTP", html);
      await userService.updateLoginVerificationOtp(user.id, token);

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

  signUp: async ({ body: { email, password, name } }: IBodyRequest<SignUpPayload>, res: Response) => {
    try {
      const exists = await userService.getByEmail(email);
      if (exists) {
        return res.status(StatusCodes.CONFLICT).json({
          message: ReasonPhrases.CONFLICT,
          status: StatusCodes.CONFLICT,
        });
      }

      const hash = await createHash(password);

      const otp = generateOTP(5);

      const { qrId } = generateLoginQR();

      await userService.create({ email, password: hash, name, otp, loginQRCode: qrId });

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
      const token = generateOTP(5);

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

      const otp = generateOTP(5);

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

  modifyLoginStatus: async (req: ICombinedRequest<IUserRequest, Pick<IUser, "loginWithQRCode">>, res: Response) => {
    try {
      const { loginWithQRCode } = req.body;
      const { user } = req.context;

      await userService.updateLoginWithQRCode(user.id, loginWithQRCode);

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

  modifyNotificationStatus: async (
    req: ICombinedRequest<IUserRequest, Pick<IUser, "notificationStatus">>,
    res: Response
  ) => {
    try {
      const { notificationStatus } = req.body;
      const { user } = req.context;

      await userService.updateNotificationStatus(user.id, notificationStatus);

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

  updateFcmToken: async (
    req: ICombinedRequest<IUserRequest, Pick<IUser, "fcmToken" | "deviceUniqueId">>,
    res: Response
  ) => {
    try {
      const { fcmToken, deviceUniqueId } = req.body;
      const { user } = req.context;

      await userService.updateFCMToken(user.id, fcmToken!, deviceUniqueId!);

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

  deleteProfile: async (req: ICombinedRequest<IUserRequest, Pick<IUser, "password">>, res: Response) => {
    const session = await mongoose.startSession();
    try {
      const { user } = req.context;
      const { password } = req.body;

      if (!comparePassword(password, user.password)) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: ReasonPhrases.UNAUTHORIZED,
          status: StatusCodes.UNAUTHORIZED,
        });
      }

      session.startTransaction();

      await conversationService.sendDeleteConversationNotificationsToAllMembers(user.id, session);
      await passwordResetService.deleteAllPasswordResetsByEmail(user.email, session);
      await messageService.deleteAllMessagesByUser(user.id, session);
      await conversationService.deleteAllUserConversations(user.id, session);
      await userService.deleteProfile(user.id, session);

      await session.commitTransaction();
      session.endSession();

      return res.status(StatusCodes.OK).json({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (err) {
      await session.abortTransaction();
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },
};
