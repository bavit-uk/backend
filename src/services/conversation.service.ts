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
        const lastMessage = await messageService.getLastMessage({ conversation: conversation._id });
        const { totalMessages, unreadMessages } = await messageService.getTotalAndUnreadMessages(
          conversation.id,
          userId
        );
        return { ...conversation.toObject(), lastMessage, totalMessages, unreadMessages };
      })
    );
    return conversationsWithLastMessage;
  },
  getConversation: (userId: string, conversationId: string) => {
    const conversation = Conversation.findOne({ members: userId, _id: conversationId }).populate("members").exec();
    const lastMessage = messageService.getLastMessage({ conversation: new Types.ObjectId(conversationId) });

    const conversationWithLastMessage = Promise.all([conversation, lastMessage]).then(([conversation, lastMessage]) => {
      if (!conversation) return null;
      return { ...conversation.toObject(), lastMessage };
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

  readConversation: (userId: string, conversationId: string) => {
    return messageService.readMessages({ conversationId: conversationId, to: userId });
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

  lockConversation: (userId: string, conversationId: string) => {
    return Conversation.findOneAndUpdate({ members: userId, _id: conversationId }, { locked: true }).exec();
  },
};
