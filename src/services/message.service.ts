import { CreateMessagePayload, GetMessagePayload, UpdateMessagePayload } from "@/contracts/message.contract";
import { Message } from "@/models";
import { ClientSession } from "mongoose";

export const messageService = {
  create: ({ content, conversation, files, sender }: CreateMessagePayload, session?: ClientSession) =>
    new Message({
      content,
      conversation,
      files,
      sender,
    }).save({ session }),

  getMessageById: (messageId: string) => Message.findById(messageId),

  update: async ({ content, conversation, files, id }: UpdateMessagePayload) => {
    Message.findOneAndUpdate({ conversation, _id: id }, { content, files });
  },

  updateMessageReceived: async ({ conversation, id }: GetMessagePayload) => {
    Message.findOneAndUpdate(
      {
        conversation,
        _id: id,
      },
      { received: true }
    );
  },

  updateMessageRead: async ({ conversation, id }: GetMessagePayload) => {
    Message.findOneAndUpdate(
      {
        conversation,
        _id: id,
      },
      { read: true }
    );
  },

  getAll: ({ conversation }: Pick<GetMessagePayload, "conversation">) => Message.find({ conversation }),

  getByConversationId: ({ conversation }: Pick<GetMessagePayload, "conversation">) => Message.find({ conversation }),

  getLastMessage: ({ conversation }: Pick<GetMessagePayload, "conversation">) =>
    Message.findOne({ conversation }).sort({ createdAt: -1 }).select("content createdAt files"),

  getTotalAndUnreadMessages: async (conversationId: string) => {
    const totalMessagesPromise = Message.countDocuments({ conversation: conversationId });
    const unreadMessagesPromise = Message.countDocuments({ conversation: conversationId, read: false });

    const [totalMessages, unreadMessages] = await Promise.all([totalMessagesPromise, unreadMessagesPromise]);

    return { totalMessages, unreadMessages };
  },
};
