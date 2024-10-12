import { CreateMessagePayload, GetMessagePayload, UpdateMessagePayload } from "@/contracts/message.contract";
import { Message } from "@/models";
import { ClientSession, Types } from "mongoose";
import { conversationService } from "./conversation.service";

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

  findLastMashupMessage: async ({ conversation }: Pick<UpdateMessagePayload, "conversation">) => {
    return Message.findOne({ conversation, isQrCode: true }).sort({ createdAt: -1 }).limit(1);
  },

  addScannedBy: async ({
    conversation,
    id,
    scannedBy,
  }: Pick<UpdateMessagePayload, "conversation" | "id" | "scannedBy">) => {
    return Message.findOneAndUpdate({ conversation, _id: id, isQrCode: true }, { $addToSet: { scannedBy } });
  },

  getAllMashupsSentByUser: async (sender: string) => {
    return Message.aggregate([
      {
        $match: {
          sender: new Types.ObjectId(sender),
          isQrCode: true,
        },
      },
      {
        $lookup: {
          from: "conversations",
          localField: "conversation",
          foreignField: "_id",
          as: "conversation",
        },
      },
      { $unwind: "$conversation" },
      {
        $lookup: {
          from: "users",
          let: {
            members: "$conversation.members",
            isGroup: "$conversation.isGroup",
            sender: new Types.ObjectId(sender),
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$members"] },
                    { $ne: ["$_id", "$$sender"] },
                    {
                      $cond: {
                        if: { $eq: ["$$isGroup", false] },
                        then: { $ne: ["$_id", "$$sender"] },
                        else: true,
                      },
                    },
                  ],
                },
              },
            },
          ],
          as: "receiverInfo",
        },
      },
      {
        $unwind: {
          path: "$receiverInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          content: { $first: "$content" },
          createdAt: { $first: "$createdAt" },
          files: { $first: "$files" },
          isQrCode: { $first: "$isQrCode" },
          scannedBy: { $first: "$scannedBy" },
          title: { $first: "$conversation.title" },
          description: { $first: "$conversation.description" },
          receiverInfo: { $first: "$receiverInfo" },
        },
      },
      {
        $project: {
          _id: 0,
          content: 1,
          createdAt: 1,
          files: 1,
          isQrCode: 1,
          title: 1,
          description: 1,
          receiver: {
            $cond: {
              if: { $eq: ["$receiverInfo", null] },
              then: "$title",
              else: "$receiverInfo.name",
            },
          },
          id: "$_id",
        },
      },
    ]).exec();
  },

  getAllMashupsReceivedByUser: async (receiver: string) => {
    const allConversationIds = await conversationService.getAllConversationIds(receiver);

    return Message.aggregate([
      {
        $match: {
          conversation: { $in: allConversationIds.map((id) => new Types.ObjectId(id)) },
          sender: { $ne: new Types.ObjectId(receiver) },
          isQrCode: true,
        },
      },
      {
        $lookup: {
          from: "conversations",
          localField: "conversation",
          foreignField: "_id",
          as: "conversation",
        },
      },
      { $unwind: "$conversation" },
      {
        $lookup: {
          from: "users",
          let: {
            members: "$conversation.members",
            isGroup: "$conversation.isGroup",
            sender: "$sender",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$members"] },
                    { $ne: ["$_id", new Types.ObjectId(receiver)] },
                    { $eq: ["$_id", "$$sender"] },
                    {
                      $cond: {
                        if: { $eq: ["$$isGroup", false] },
                        then: { $ne: ["$_id", new Types.ObjectId(receiver)] },
                        else: true,
                      },
                    },
                  ],
                },
              },
            },
          ],
          as: "senderInfo",
        },
      },
      {
        $unwind: {
          path: "$senderInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          content: { $first: "$content" },
          createdAt: { $first: "$createdAt" },
          files: { $first: "$files" },
          isQrCode: { $first: "$isQrCode" },
          scannedBy: { $first: "$scannedBy" },
          title: { $first: "$conversation.title" },
          description: { $first: "$conversation.description" },
          senderInfo: { $first: "$senderInfo" },
        },
      },
      {
        $project: {
          _id: 0,
          content: 1,
          createdAt: 1,
          files: 1,
          isQrCode: 1,
          title: 1,
          description: 1,
          sender: {
            $cond: {
              if: { $eq: ["$senderInfo", null] },
              then: "$title",
              else: "$senderInfo.name",
            },
          },
          id: "$_id",
        },
      },
    ]).exec();
  },
};
