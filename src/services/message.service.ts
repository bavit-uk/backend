import { CreateMessagePayload, GetMessagePayload, UpdateMessagePayload } from "@/contracts/message.contract";
import { Message } from "@/models";
import { ClientSession } from "mongoose";

export const messageService = {
  create: (
    { content, conversation, files, sender, isQrCode, scannedBy }: CreateMessagePayload,
    session?: ClientSession
  ) =>
    new Message({
      content,
      conversation,
      files,
      sender,
      isQrCode,
      scannedBy,
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

  getAll: ({
    conversation,
    lastMessageDate = Date.now(),
  }: Pick<GetMessagePayload, "conversation"> & { lastMessageDate: Number }) =>
    Message.find({ conversation, createdAt: { $lte: lastMessageDate } }),

  getByConversationId: ({ conversation }: Pick<GetMessagePayload, "conversation">) => Message.find({ conversation }),

  getLastMessage: ({
    conversation,
    lastMessageDate = Date.now(),
  }: Pick<GetMessagePayload, "conversation"> & { lastMessageDate?: Number }) =>
    Message.findOne({ conversation, createdAt: { $lte: lastMessageDate } })
      .sort({ createdAt: -1 })
      .select("content createdAt files isQrCode scannedBy"),

  getTotalAndUnreadMessages: async (conversationId: string, to: string, lastMessageDate: Number = Date.now()) => {
    const totalMessagesPromise = Message.countDocuments({
      conversation: conversationId,
      createdAt: { $lt: lastMessageDate },
    });
    const unreadMessagesPromise = Message.countDocuments({
      conversation: conversationId,
      read: false,
      sender: { $ne: to },
      createdAt: { $lt: lastMessageDate },
    });

    const [totalMessages, unreadMessages] = await Promise.all([totalMessagesPromise, unreadMessagesPromise]);

    return { totalMessages, unreadMessages };
  },

  readMessages: async ({
    conversationId,
    to,
    lastMessageDate,
  }: {
    conversationId: string;
    to: string;
    lastMessageDate: Number;
  }) => {
    return Message.updateMany(
      { conversation: conversationId, sender: { $ne: to }, createdAt: { $lt: lastMessageDate } },
      { read: true }
    );
  },

  findUnscannedMessages: async ({
    conversation,
    scannedBy,
  }: Pick<UpdateMessagePayload, "conversation" | "scannedBy">) => {
    const personToCheck = scannedBy;
    return Message.find({ conversation, isQrCode: true, scannedBy: { $nin: personToCheck } })
      .sort({ createdAt: 1 })
      .limit(1);
  },

  addScannedBy: async ({
    conversation,
    id,
    scannedBy,
  }: Pick<UpdateMessagePayload, "conversation" | "id" | "scannedBy">) => {
    return Message.findOneAndUpdate({ conversation, _id: id, isQrCode: true }, { $addToSet: { scannedBy } });
  },
};
