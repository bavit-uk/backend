import { PasswordReset } from "@/models";
import { ClientSession } from "mongoose";

export const passwordResetService = {
  createPasswordReset: (
    { email, token, expireAt }: { email: string; token: string; expireAt: Date },
    session?: ClientSession
  ) =>
    new PasswordReset({
      email,
      token,
      expireAt,
    }).save({ session }),

  updateAllUnusedPasswordResetsToUsed: (email: string, session?: ClientSession) =>
    PasswordReset.updateMany(
      { email, isUsed: false, expireAt: { $gte: new Date() } },
      { $set: { isUsed: true } },
      { session }
    ),

  findAllUnusedPasswordResetsByEmail: (email: string) =>
    PasswordReset.find({ email, isUsed: false, expireAt: { $gte: new Date() } }),

  findPasswordResetByEmailAndToken: (email: string, token: string) =>
    PasswordReset.findOne({ email, token, isUsed: false, expireAt: { $gte: new Date() } }),

  updatePasswordResetToUsed: (email: string, token: string, session?: ClientSession) =>
    PasswordReset.updateOne({ email, token, isUsed: false }, { $set: { isUsed: true } }, { session }),
};
