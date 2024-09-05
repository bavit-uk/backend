import { ClientSession } from "mongoose";

import { User, PasswordReset } from "@/models";
import { UserUpdatePayload } from "@/contracts/user.contract";

export const userService = {
  create: (
    {
      name,
      email,
      password,
      verified = false,
    }: {
      name: string;
      email: string;
      password: string;
      verified?: boolean;
    },
    session?: ClientSession
  ) =>
    new User({
      name,
      email,
      password,
      verified,
    }).save({ session }),

  getAll: () => User.find(),

  getAllWithPasswordRequests: () => {
    return User.aggregate([
      {
        $lookup: {
          from: "passwordresets",
          localField: "email",
          foreignField: "email",
          as: "passwordRequests",
          pipeline: [
            {
              $match: {
                isUsed: false,
                expireAt: { $gte: new Date() },
              },
            },
            {
              $project: {
                _id: 1,
                email: 1,
                token: 1,
                expireAt: 1,
              },
            },
          ],
        },
      },
    ]);
  },

  getById: (userId: string) => User.findById(userId),

  getByEmail: (email: string) => User.findOne({ email }),

  isExistByEmail: (email: string) => User.exists({ email }),

  updatePasswordByUserId: (userId: string, password: string, session?: ClientSession) => {
    const data = [{ _id: userId }, { password }];

    let params = null;

    if (session) {
      params = [...data, { session }];
    } else {
      params = data;
    }

    return User.findOneAndUpdate(...params, { new: true });
  },

  updateVerificationAndEmailByUserId: (userId: string, email: string, session?: ClientSession) => {
    const data = [{ _id: userId }, { email, verified: true, verifications: [] }];

    let params = null;

    if (session) {
      params = [...data, { session }];
    } else {
      params = data;
    }

    return User.updateOne(...params);
  },

  updateProfileByUserId: (userId: string, updatedData: UserUpdatePayload, session?: ClientSession) => {
    const data = [{ _id: userId }, updatedData];

    let params = null;

    if (session) {
      params = [...data, { session }];
    } else {
      params = data;
    }

    return User.updateOne(...params);
  },

  updateEmailByUserId: (userId: string, email: string, session?: ClientSession) => {
    const data = [{ _id: userId }, { email, verified: false }];

    let params = null;

    if (session) {
      params = [...data, { session }];
    } else {
      params = data;
    }

    return User.updateOne(...params);
  },

  deleteById: (userId: string, session?: ClientSession) => User.deleteOne({ user: userId }, { session }),

  createPasswordReset: (
    { email, token, expireAt }: { email: string; token: string; expireAt: Date },
    session?: ClientSession
  ) =>
    new PasswordReset({
      email,
      token,
      expireAt,
    }).save({ session }),

  getPasswordResetByEmail: (email: string) => PasswordReset.findOne({ email }),

  deletePasswordResetByEmail: (email: string, session?: ClientSession) =>
    PasswordReset.deleteOne({ email }, { session }),
};
