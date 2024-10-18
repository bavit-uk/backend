import { ClientSession } from "mongoose";

import { User, PasswordReset } from "@/models";
import { UserCreatePayload, UserUpdatePayload } from "@/contracts/user.contract";
import { SignUpPayload } from "@/contracts/auth.contract";

export const userService = {
  create: ({ email, name, password, otp, loginQRCode }: UserCreatePayload, session?: ClientSession) =>
    new User({
      name,
      email,
      password,
      otp: otp ?? null,
      otpExpiresAt: otp ?? new Date(Date.now() + 10 * 60 * 1000),
      loginQRCode: loginQRCode ?? null,
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

  getById: (userId: string, select?: string) => {
    if (select) {
      return User.findById(userId).select(select);
    }
    return User.findById(userId);
  },

  getByEmail: (email: string, select?: string) => {
    if (select) {
      return User.findOne({ email }).select(select);
    }
    return User.findOne({ email });
  },

  getByLoginQRCode: (loginQRCode: string, select?: string) => {
    if (select) {
      return User.findOne({ loginQRCode }).select(select);
    }
    return User.findOne({ loginQRCode });
  },

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

  getPasswordResetByEmail: (email: string) => PasswordReset.findOne({ email }),

  deletePasswordResetByEmail: (email: string, session?: ClientSession) =>
    PasswordReset.deleteOne({ email }, { session }),

  updateEmailVerificationStatus: (id: string, status: boolean, session?: ClientSession) =>
    User.updateOne({ _id: id }, { emailVerified: status, emailVerifiedAt: new Date() }, { session }),

  updateEmailVerificationOtp: (id: string, otp: string, session?: ClientSession) =>
    User.updateOne({ _id: id }, { otp, otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) }, { session }),

  getRegisteredContacts: (contacts: string[]) =>
    User.find({
      mobileNumber: {
        $exists: true,
        $nin: [null, ""],
        $in: contacts,
      },
    }).select("mobileNumber countryCode"),

  updateLoginWithQRCode: (userId: string, loginWithQRCode: boolean, session?: ClientSession) =>
    User.updateOne({ _id: userId }, { loginWithQRCode }, { session }),

  updateNotificationStatus: (userId: string, notificationStatus: boolean, session?: ClientSession) =>
    User.updateOne({ _id: userId }, { notificationStatus }, { session }),

  updateFCMToken: (userId: string, fcmToken: string, session?: ClientSession) =>
    User.updateOne({ _id: userId }, { fcmToken }, { session }),

  getFCMToken: async (userId: string) => {
    const user = await User.findById(userId).select("fcmToken");
    return user?.fcmToken;
  },

  updateStripeCustomerId: (userId: string, stripeCustomerId: string, session?: ClientSession) =>
    User.updateOne({ _id: userId }, { stripeCustomerId }, { session }),

  updateSubscriptionId: (userId: string, subscriptionId: string, session?: ClientSession) =>
    User.updateOne({ _id: userId }, { subscriptionId }, { session }),

  activateSubscription: (stripeCustomerId: string, startDate?: Date, endDate?: Date, session?: ClientSession) =>
    User.updateOne(
      { stripeCustomerId },
      {
        isSubscriptionActive: true,
        subscriptionActivatedAt: startDate ?? new Date(),
        lastPaymentAt: startDate ?? new Date(),
        subscriptionExpiresAt: endDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { session }
    ),

  deactivateSubscription: (stripeCustomerId: string, session?: ClientSession) =>
    User.updateOne({ stripeCustomerId }, { isSubscriptionActive: false }, { session }),

  getUserByStripeCustomerId: (stripeCustomerId: string) => User.findOne({ stripeCustomerId }),

  decrementMessageCount: async (userIds: string[], session?: ClientSession) =>
    User.updateMany(
      { _id: { $in: userIds } },
      {
        $inc: {
          "limits.remainingMessages": -1,
        },
      },
      { session }
    ),

  incrementMessageCount: (userIds: string[], session?: ClientSession) =>
    User.updateMany(
      { _id: { $in: userIds } },
      {
        $inc: {
          "limits.remainingMessages": 1,
        },
      },
      { session }
    ),

  // incrementMessageCount: (userIds: string[], session?: ClientSession) =>
  //   User.updateOne(
  //     { _id: { $in: userIds } },
  //     {
  //       $inc: {
  //         "limits.remainingMessages": 1,
  //       },
  //     },
  //     { session }
  //   ),

  decrementChatCount: (userIds: string[], session?: ClientSession) =>
    User.updateMany(
      { _id: { $in: userIds } },
      {
        $inc: {
          "limits.remainingChats": -1,
        },
      },
      { session }
    ),

  incrementChatCount: (userIds: string[], session?: ClientSession) =>
    User.updateMany(
      { _id: { $in: userIds } },
      {
        $inc: {
          "limits.remainingChats": 1,
        },
      },
      { session }
    ),

  checkIfAnyConversationLimitExceeded: (userIds: string[], type: "BOTH" | "MESSAGES" | "CHATS") => {
    if (type === "BOTH") {
      return User.find({
        _id: { $in: userIds },
        isSubscriptionActive: false,
        $and: [
          {
            $or: [
              {
                subscriptionExpiresAt: { $exists: false },
              },
              {
                subscriptionExpiresAt: { $eq: null },
              },
              {
                subscriptionExpiresAt: { $lte: new Date() },
              },
            ],
          },
          { $or: [{ "limits.remainingMessages": { $lte: 0 } }, { "limits.remainingChats": { $lte: 0 } }] },
        ],
      });
    }
    if (type === "MESSAGES") {
      return User.find({
        _id: { $in: userIds },
        isSubscriptionActive: false,
        $or: [
          {
            subscriptionExpiresAt: { $exists: false },
          },
          {
            subscriptionExpiresAt: { $eq: null },
          },
          {
            subscriptionExpiresAt: { $lte: new Date() },
          },
        ],
        "limits.remainingMessages": { $lte: 0 },
      });
    }
    if (type === "CHATS") {
      return User.find({
        _id: { $in: userIds },
        isSubscriptionActive: false,
        $or: [
          {
            subscriptionExpiresAt: { $exists: false },
          },
          {
            subscriptionExpiresAt: { $eq: null },
          },
          {
            subscriptionExpiresAt: { $lte: new Date() },
          },
        ],
        "limits.remainingChats": { $lte: 0 },
      });
    }

    return [];
  },

  deleteProfile: (userId: string, session?: ClientSession) => User.deleteOne({ _id: userId }, { session }),

  getUsersByIds: (userIds: string[]) => User.find({ _id: { $in: userIds } }),
};
