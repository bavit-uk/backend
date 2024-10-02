import { CreateConversationPayload } from "@/contracts/conversation.contract";
import { IUserRequest } from "@/contracts/request.contract";
import { Conversation } from "@/models/conversation.model";
import { ClientSession, get, Types } from "mongoose";
import { messageService } from "./message.service";
import { userService } from "./user.service";

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
    const conversations = await Conversation.find({ members: userId }).populate("members").exec();
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
    return conversationsWithLastMessage;
  },
  getConversation: async (userId: string, conversationId: string) => {
    const conversation = Conversation.findOne({ members: userId, _id: conversationId }).populate("members").exec();

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

  updateConversation: (userId: string, conversationId: string, payload: Partial<CreateConversationPayload>) => {
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
};
