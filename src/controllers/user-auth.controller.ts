import { NextFunction, Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { authService } from "@/services";
import { User } from "@/models";
import { jwtSign, jwtVerify } from "@/utils/jwt.util";
import crypto from "crypto";
import sendEmail from "@/utils/nodeMailer";

export const authController = {
  registerUser: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      // Check if user already exists
      const existingUser = await authService.findExistingEmail(email);
      if (existingUser) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: "User with this email already exists" });
      }
      // Create new user
      const newUser = await authService.createUser(req.body);

      // send verification email
      const verificationToken = jwtSign(newUser.id);
      // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

      const html = `<p>Please verify your email by clicking the link below:</p>
                    <a href="${verificationUrl}">Verify Email</a>`;
      // Use sendEmail to send the verification email
      await sendEmail({
        to: newUser.email,
        subject: "Verify your email address",
        html,
      });
      res.status(StatusCodes.CREATED).json({
        message:
          "User registered successfully, Please check your email to verify your account.",
        user: newUser,
        verificationToken: verificationToken.accessToken, // Include token for testing purposes
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error registering user" });
    }
  },

  loginUser: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      // Find user by email first
      const user = await authService.findExistingEmail(email, "+password");
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }
      // Check password using the model method
      const isPasswordValid = user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: ReasonPhrases.UNAUTHORIZED,
          status: StatusCodes.UNAUTHORIZED,
        });
      }
      // const accessToken = jwtSign
      const { accessToken, refreshToken } = jwtSign(user.id);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // Access Token lifespan (15 minutes in ms)
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // Refresh Token lifespan (7 days in ms)
      });
      return res.status(StatusCodes.OK).json({
        data: { user: user.toJSON() },
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

  verifyEmail: async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      if (!token || typeof token !== "string") {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: "Invalid verification token." });
      }
      const decoded = jwtVerify(token);
      const userId = decoded.id.toString();
      const user = await authService.findUserById(userId);
      if (!user) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ success: false, message: "User not found." });
      }
      // Check if already verified
      if (user.isEmailVerified) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: "Email is already verified." });
      }

      // Update user's verification status
      user.isEmailVerified = true;
      user.EmailVerifiedAt = new Date();
      await user.save();
      res
        .status(StatusCodes.OK)
        .json({ success: true, message: "Email verified successfully." });
    } catch (error) {
      console.error("Error verifying email:", error);
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Invalid or expired token." });
    }
  },

  getProfile: async (req: Request, res: Response) => {
    try {
      // const userId = req.body.user?._id;
      // const user = await authService.findUserById(userId);
      const user = req.context.user;
      // console.log("User in controller : " , user)
      if (!user) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "User not found" });
      }
      return res.status(StatusCodes.OK).json({ user });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error fetching user profile" });
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    try {
      const {
        firstName,
        lastName,
        phoneNumber,
        profileImage,
        oldPassword,
        newPassword,
      } = req.body;

      // const user = await authService.findUserById(req.body.user.id, "+password");
      const user = req.context.user;
      console.log("User in controller : ", user);
      if (!user) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "User not found" });
      }
      if (firstName) {
        user.firstName = firstName;
      }
      if (lastName) {
        user.lastName = lastName;
      }
      if (phoneNumber) {
        user.phoneNumber = phoneNumber;
      }
      if (profileImage) {
        user.profileImage = profileImage;
      }
      // Check if password update is requested
      if (newPassword) {
        if (!oldPassword) {
          // Old password must be provided if new password is being updated
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Old password is required to update the password",
          });
        }
        // Verify the old password
        const isPasswordCorrect = user.comparePassword(oldPassword);
        if (!isPasswordCorrect) {
          return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Old password is incorrect",
          });
        }
        // Hash the new password and update it
        user.password = user.hashPassword(newPassword);
      }
      await user.save();
      // Respond with the updated user information
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          profileImage: user.profileImage,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error updating profile",
      });
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await authService.findExistingEmail(email);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      // Generate a reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiration

      // Save the token and expiry to the user record
      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      // Construct reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      console.log("resetURL : ", resetUrl);

      const message = `
        <p>You requested a password reset.</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
        <p>This link is valid for 10 minutes.</p>
       `;

      try {
        await sendEmail({
          to: user.email,
          subject: "Password Reset Request",
          html: message,
        });
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Reset password email sent",
        });
      } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        throw new Error("Email could not be sent");
      }
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error processing request" });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Hash the token and compare it to the stored token
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // Find user by the reset token and check expiration
      const user = await authService.findUserByResetToken(hashedToken);
      if (
        !user ||
        !user.resetPasswordExpires ||
        user.resetPasswordExpires < Date.now()
      ) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Invalid or expired token" });
      }

      // Update the password and clear the reset token
      user.password = user.hashPassword(password);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res
        .status(StatusCodes.OK)
        .json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error processing request" });
    }
  },
};

//   googleAuth: async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const user = req.user as any;
//       const { accessToken, refreshToken } = jwtSign(user.id);
//       // Set tokens in cookies
//       res.cookie("accessToken", accessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 15 * 60 * 1000, // 15 minutes
//       });
//       res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//       });
//       // Redirect to your front-end or a dashboard
//       res.redirect("/dashboard");
//     } catch (error) {
//       console.log(error);
//       return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//         message: ReasonPhrases.INTERNAL_SERVER_ERROR,
//         status: StatusCodes.INTERNAL_SERVER_ERROR,
//       });
//     }
//   },

// };
