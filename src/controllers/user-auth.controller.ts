import { NextFunction, Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { authService } from "@/services";
import { User } from "@/models";
import { jwtSign } from "@/utils/jwt.util";
import crypto from "crypto"

export const authController = {
  registerUser: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      // Check if user already exists
      const existingUser = await authService.findExistingEmail(email);
      if (existingUser) {
        return res.status(StatusCodes.CONFLICT).json({ message: "User with this email already exists" });
      }
      // Create new user
      const newUser = await authService.createUser(req.body);
      res.status(StatusCodes.CREATED).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error registering user" });
    }
  },

  loginUser: async (req: Request, res: Response, next: NextFunction) => {
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

  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
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
      const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      const resetTokenExpiry = Date.now() + 3600 * 1000; // 1 hour expiration
    } catch (error) {}
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
