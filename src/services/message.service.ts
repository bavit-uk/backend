import { CreateMessagePayload, GetMessagePayload, UpdateMessagePayload } from "@/contracts/message.contract";
import { Message } from "@/models";
import { ClientSession } from "mongoose";

export const messageService = {
  create: ({ content, sender, receiver, files }: CreateMessagePayload, session?: ClientSession) =>
    new Message({
      content,
      sender,
      receiver,
      files,
    }).save({ session }),

  getMessageById: (messageId: string) => Message.findById(messageId),

  update: async ({ content, sender, receiver, files }: UpdateMessagePayload) => {
    Message.findOneAndUpdate({ sender, receiver }, { content, files });
  },

  updateMessageReceived: async ({ sender, receiver }: GetMessagePayload) => {
    Message.findOneAndUpdate({ sender, receiver }, { received: true });
  },

  updateMessageRead: async ({ sender, receiver }: GetMessagePayload) => {
    Message.findOneAndUpdate({ sender, receiver }, { read: true });
  },

  getAll: ({ sender, receiver }: GetMessagePayload) =>
    Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }),
};
