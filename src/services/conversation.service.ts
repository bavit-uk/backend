import { CreateConversationPayload } from "@/contracts/conversation.contract";
import { IUserRequest } from "@/contracts/request.contract";
import { Conversation } from "@/models/conversation.model";
import { ClientSession, get } from "mongoose";

export const conversationService = {
  create: (
    { userId, members, title, description, image, isGroup }: CreateConversationPayload & { userId: string },
    session?: ClientSession
  ) => {
    const uniqueMembers = [...new Set([...members, userId])];
    return new Conversation({
      members: uniqueMembers,
      title,
      description,
      image,
      isGroup: uniqueMembers.length > 2 ? true : isGroup,
    }).save({ session });
  },

  getConversations: (userId: string) => {
    return Conversation.find({ members: userId }).exec();
  },
  getConversation: (userId: string, conversationId: string) => {
    return Conversation.findOne({ members: userId, _id: conversationId }).exec();
  },

  updateConversation: (userId: string, conversationId: string, payload: Partial<CreateConversationPayload>) => {
    return Conversation.findOneAndUpdate(
      { members: userId, _id: conversationId },
      { $set: payload },
      { new: true }
    ).exec();
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
};
