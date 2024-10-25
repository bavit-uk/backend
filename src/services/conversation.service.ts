import { CreateConversationPayload } from "@/contracts/conversation.contract";
import { IUserRequest } from "@/contracts/request.contract";
import { Conversation } from "@/models/conversation.model";
import { ClientSession, get, Types } from "mongoose";
import { messageService } from "./message.service";
import { userService } from "./user.service";
import { IUser } from "@/contracts/user.contract";
import { socketManager } from "@/datasources/socket.datasource";

export const conversationService = {
  create: async (
    { userId, members, title, description, image, isGroup }: CreateConversationPayload & { userId: string },
    session?: ClientSession
  ) => {
    const uniqueMembers = [...new Set([...members, userId])];

    if (!isGroup) {
      const otherMember = uniqueMembers.find((member) => member !== userId);
      if (!otherMember) throw new Error("Other member not found");
      const otherUser = await userService.getById(otherMember.toString());
      title = otherUser?.name;
      image = otherUser?.profilePicture;
    }

    return new Conversation({
      members: uniqueMembers,
      title,
      description,
      image,
      isGroup: uniqueMembers.length > 2 ? true : isGroup,
      admin: isGroup ? [userId] : [],
    }).save({ session });
  },

  checkConversationExists: async (userId: string, members: string[]) => {
    const uniqueMembers = [...new Set([...members, userId])];
    return Conversation.findOne({
      isGroup: false,
      members: { $size: uniqueMembers.length, $all: uniqueMembers },
    }).exec();
  },

  getConversations: async (userId: string) => {
    const conversations = await Conversation.find({ members: userId }).populate<{ members: IUser[] }>("members").exec();
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        let lastMessageTime = Date.now();
        const unscannedMessages = await messageService.findUnscannedMessages({
          conversation: conversation._id,
          scannedBy: new Types.ObjectId(userId),
        });
        if (unscannedMessages.length > 0) {
          const lastUnscannedMessageCreatedAt = unscannedMessages[0].createdAt;
          lastMessageTime = new Date(lastUnscannedMessageCreatedAt).getTime();
        }
        const lastMessage = await messageService.getLastMessage({
          conversation: conversation._id,
          lastMessageDate: lastMessageTime,
        });
        const { totalMessages, unreadMessages } = await messageService.getTotalAndUnreadMessages(
          conversation.id,
          userId,
          lastMessageTime
        );

        return {
          ...conversation.toObject(),
          lastMessage,
          totalMessages,
          unreadMessages,
          locked: unscannedMessages.length > 0 ? true : false,
        };
      })
    );

    // Sort conversations based on the lastMessage createdAt timestamp
    const sortedConversations = conversationsWithLastMessage.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime; // Sort in descending order (most recent first)
    });

    return sortedConversations;
  },
  getConversation: async (userId: string, conversationId: string) => {
    const conversation = Conversation.findOne({ members: userId, _id: conversationId })
      .populate<{ members: IUser[] }>("members")
      .exec();

    const unscannedMessages = await messageService.findUnscannedMessages({
      conversation: new Types.ObjectId(conversationId),
      scannedBy: new Types.ObjectId(userId),
    });

    let lastMessageTime = Date.now();

    if (unscannedMessages.length > 0) {
      const lastUnscannedMessageCreatedAt = unscannedMessages[0].createdAt;
      lastMessageTime = new Date(lastUnscannedMessageCreatedAt).getTime();
    }

    const lastMessage = messageService.getLastMessage({
      conversation: new Types.ObjectId(conversationId),
      lastMessageDate: lastMessageTime,
    });

    const conversationWithLastMessage = Promise.all([conversation, lastMessage]).then(([conversation, lastMessage]) => {
      if (!conversation) return null;
      return {
        ...conversation.toObject(),
        lastMessage,
        lastMessageTime,
        locked: unscannedMessages.length > 0 ? true : false,
      };
    });

    return conversationWithLastMessage;
  },

  updateConversation: (
    userId: string,
    conversationId: string,
    payload: Partial<CreateConversationPayload> & { admin?: Types.ObjectId[] }
  ) => {
    return Conversation.findOneAndUpdate(
      { members: userId, _id: conversationId },
      { $set: payload },
      { new: true }
    ).exec();
  },

  readConversation: async (userId: string, conversationId: string) => {
    let lastMessageTime = Date.now();
    const unscannedMessages = await messageService.findUnscannedMessages({
      conversation: new Types.ObjectId(conversationId),
      scannedBy: new Types.ObjectId(userId),
    });
    if (unscannedMessages.length > 0) {
      const lastUnscannedMessageCreatedAt = unscannedMessages[0].createdAt;
      lastMessageTime = new Date(lastUnscannedMessageCreatedAt).getTime();
    }
    return messageService.readMessages({
      conversationId: conversationId,
      to: userId,
      lastMessageDate: lastMessageTime,
    });
  },

  deleteConversation: (userId: string, conversationId: string) => {
    return Conversation.findOneAndDelete({ members: userId, _id: conversationId }).exec();
  },

  blockConversation: (userId: string, conversationId: string) => {
    return Conversation.findOneAndUpdate(
      { members: userId, _id: conversationId },
      { $addToSet: { blocked: userId } }
    ).exec();
  },

  unblockConversation: (userId: string, conversationId: string) => {
    return Conversation.findOneAndUpdate(
      { members: userId, _id: conversationId },
      { $pull: { blocked: userId } }
    ).exec();
  },

  getAllConversationIds: async (userId: string) => {
    const conversations = await Conversation.find({ members: userId }).exec();
    return conversations.map((conversation) => conversation.id);
  },

  getBlockedUsers: async (userId: string) => {
    return Conversation.aggregate([
      {
        $match: {
          members: { $in: [new Types.ObjectId(userId)] },
          blocked: { $in: [new Types.ObjectId(userId)] },
          isGroup: false,
        },
      },
      //  Get the first member that is not the user
      {
        $project: {
          members: {
            $filter: {
              input: "$members",
              as: "member",
              cond: { $ne: ["$$member", new Types.ObjectId(userId)] },
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { name: 1, email: 1, mobileNumber: 1, countryCode: 1, countryCodeName: 1 } }],
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          user: 1,
          _id: 0,
          conversationId: "$_id",
        },
      },
    ]).exec();
  },

  removeMember: (userId: string, conversationId: string, memberId: string) => {
    return Conversation.findOneAndUpdate(
      { members: userId, _id: conversationId },
      { $pull: { members: memberId } }
    ).exec();
  },

  leaveConversation: (userId: string, conversationId: string) => {
    return Conversation.findOneAndUpdate(
      { members: userId, _id: conversationId },
      { $pull: { members: userId } }
    ).exec();
  },

  deleteAllUserConversations: async (userId: string, session?: ClientSession) => {
    // Get all conversations where the user is a member
    const userConversations = await Conversation.find({ members: userId }).exec();

    const promises: Promise<any>[] = [];

    for (const conversation of userConversations) {
      if (conversation.members.length > 2) {
        promises.push(
          Conversation.updateOne({ _id: conversation._id }, { $pull: { members: userId } }, { session }).exec()
        );
      } else {
        promises.push(Conversation.deleteOne({ _id: conversation._id }, { session }).exec());
      }
    }

    return Promise.all(promises);
  },

  assignAnotherAdmin: async (userId: string, session?: ClientSession) => {
    const conversation = await Conversation.find({ admin: userId, isGroup: true }, null, {
      session,
    }).exec();

    return Promise.all(
      conversation.map((conversation) => {
        const newAdmin = conversation.members.find((member) => member.toString() !== userId);
        return Conversation.findOneAndUpdate(
          { _id: conversation.id },
          { $set: { admin: [newAdmin] } },
          { session }
        ).exec();
      })
    );
  },
  sendDeleteConversationNotificationsToAllMembers: async (userId: string, session?: ClientSession) => {
    const conversation = await Conversation.find({ members: userId }, null, { session }).exec();

    if (!conversation.length) return;

    const io = socketManager.getIo();
    if (io) {
      conversation.forEach((conversation) => {
        const members = conversation.members.map((member) => member.toString());
        const filteredMembers = members.filter((member) => member !== userId);
        console.log("filteredMembers for conversation", filteredMembers);
        if (conversation.isGroup) {
          console.log("conversation is group");
          if (conversation.members.length === 2) {
            console.log("conversation has 2 members");
            filteredMembers.forEach((member) => {
              const socketId = socketManager.getSocketId(member);
              if (socketId) {
                io.to(socketId).emit("conversation-deleted", conversation.id);
              }
            });
            // io.to(conversation.id).emit("conversation-deleted", conversation.id);
          } else {
            console.log("conversation has more than 2 members");
            filteredMembers.forEach((member) => {
              const socketId = socketManager.getSocketId(member);
              if (socketId) {
                io.to(socketId).emit("messages-deleted", conversation.id);
              }
            });
          }
        } else {
          console.log("conversation is not group");
          filteredMembers.forEach((member) => {
            const socketId = socketManager.getSocketId(member);
            if (socketId) {
              io.to(socketId).emit("conversation-deleted", conversation.id);
            }
          });
          // io.to(filteredMembers).emit("conversation-deleted", conversation.id);
        }
      });
    } else {
      console.log("io not found");
    }
  },
};
