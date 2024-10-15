import { IUser } from "@/contracts/user.contract";
import { CreateConversationPayload, UpdateConversationPayload } from "@/contracts/conversation.contract";
import { ICombinedRequest, IContextRequest, IParamsRequest, IUserRequest } from "@/contracts/request.contract";
import { conversationService, messageService, userService } from "@/services";
import { Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { ObjectId, Types } from "mongoose";
import { socketManager } from "@/datasources/socket.datasource";

export const conversationController = {
  getConversations: async ({ context: { user } }: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const conversations = await conversationService.getConversations(user.id);

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: conversations,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },
  createConversation: async (
    {
      body: { isGroup, members, description, image, title },
      context: { user },
    }: ICombinedRequest<IUserRequest, CreateConversationPayload>,
    res: Response
  ) => {
    try {
      if (!members.length) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
        });
      }

      if (members.length > 10) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
          error: "You can only create a group with at max 10 members",
        });
      }

      const alreadyExists = await conversationService.checkConversationExists(
        user.id,
        members.map((member) => member.toString())
      );

      if (alreadyExists && isGroup === false) {
        // const io = socketManager.getIo();

        // if (io) {
        //   console.log("IO Exists");
        //   const createdConversation = await conversationService.getConversation(user.id, alreadyExists.id);

        //   const allMembers = createdConversation!.members;

        //   allMembers.forEach((member) => {
        //     const socketId = socketManager.getSocketId(member.id.toString());
        //     if (socketId) {
        //       io.to(socketId).emit("create-conversation", createdConversation);
        //     }
        //   });
        // } else {
        //   console.log("IO does not exist");
        // }

        return res.status(StatusCodes.CONFLICT).json({
          status: StatusCodes.CONFLICT,
          message: ReasonPhrases.CONFLICT,
          data: alreadyExists,
        });
      }

      const conversation = await conversationService.create({
        isGroup,
        members,
        description,
        image,
        title,
        userId: user.id,
      });

      const allMembers = [...new Set([...members.map((member) => member.toString()), user.id.toString()])] as string[];

      await userService.decrementChatCount(allMembers);

      const io = socketManager.getIo();

      if (io) {
        const createdConversation = await conversationService.getConversation(user.id, conversation.id);

        allMembers.forEach((member) => {
          const socketId = socketManager.getSocketId(member);
          if (socketId) {
            io.to(socketId).emit("create-conversation", createdConversation);
          }
        });
      }

      return res.status(StatusCodes.CREATED).json({
        status: StatusCodes.CREATED,
        message: ReasonPhrases.CREATED,
        data: conversation,
      });
    } catch (error) {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },
  getConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: conversation,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },
  updateConversation: async (
    {
      body,
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, UpdateConversationPayload, { conversationId: string }>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      if (body.members) {
        body.isGroup = body.members.length > 2 ? true : body.isGroup;
      }

      const existingMembersIds = conversation.members.map((member) => member.id.toString());
      const newMembersIds = body.members ? body.members.map((member) => member.toString()) : [];
      if (body.members) {
        const addedMembers = newMembersIds.filter((member) => !existingMembersIds.includes(member));
        const removedMembers = existingMembersIds.filter((member) => !newMembersIds.includes(member));
        await Promise.all([
          userService.incrementChatCount(removedMembers),
          userService.decrementChatCount(addedMembers),
        ]);
      }

      const updatedConversation = await conversationService.updateConversation(user.id, conversationId, body);

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: updatedConversation,
      });
    } catch (error) {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  readConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const updatedConversation = await conversationService.readConversation(user.id, conversationId);

      const io = socketManager.getIo();

      if (io) {
        const allMembers = [...new Set([...conversation.members, user.id])];

        allMembers.forEach((member) => {
          const socketId = socketManager.getSocketId(member);
          if (socketId) {
            io.to(socketId).emit("read-conversation", conversation._id);
          }
        });
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: updatedConversation,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  deleteConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const deletedConversation = await conversationService.deleteConversation(user.id, conversationId);
      await userService.decrementChatCount(conversation.members.map((member) => member.id.toString()));

      return res.status(StatusCodes.NO_CONTENT).json({
        status: StatusCodes.NO_CONTENT,
        message: ReasonPhrases.NO_CONTENT,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  getMessages: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);
      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const messages = await messageService.getAll({
        conversation: new Types.ObjectId(conversationId),
        lastMessageDate: conversation.lastMessageTime,
      });

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: messages,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },
  blockConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      if (conversation.isGroup) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
          reason: "IS_GROUP_CONVERSATION",
        });
      }

      const blockedConversation = await conversationService.blockConversation(user.id, conversationId);

      const io = socketManager.getIo();
      if (io) {
        const allMembers = conversation.members;

        allMembers.forEach((member) => {
          const socketId = socketManager.getSocketId(member.id.toString());
          if (socketId) {
            io.to(socketId).emit("block-conversation", {
              conversationId: conversation._id,
              blockedBy: user.id,
            });
          }
        });
      } else {
        console.log("IO does not exist");
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: blockedConversation,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  unblockConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      if (conversation.isGroup) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
          reason: "IS_GROUP_CONVERSATION",
        });
      }

      const unblockedConversation = await conversationService.unblockConversation(user.id, conversationId);

      const io = socketManager.getIo();
      if (io) {
        const allMembers = conversation.members;

        allMembers.forEach((member) => {
          const socketId = socketManager.getSocketId(member.id.toString());
          if (socketId) {
            io.to(socketId).emit("unblock-conversation", {
              conversationId: conversation._id,
              unblockedBy: user.id,
            });
          }
        });
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: unblockedConversation,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  unlockConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const unscannedMessages = await messageService.findUnscannedMessages({
        conversation: new Types.ObjectId(conversationId),
        scannedBy: user.id,
      });

      if (!unscannedMessages.length) {
        return res.status(StatusCodes.OK).json({
          status: StatusCodes.OK,
          message: ReasonPhrases.OK,
          data: conversation,
        });
      }

      const unscannedMessage = unscannedMessages[0];

      await messageService.addScannedBy({
        id: unscannedMessage.id,
        conversation: new Types.ObjectId(conversationId),
        scannedBy: new Types.ObjectId(user.id),
      });

      const lastMashupMessage = await messageService.findLastMashupMessage({
        conversation: new Types.ObjectId(conversationId),
      });

      const scannedByUsers = lastMashupMessage?.scannedBy
        ? Array.isArray(lastMashupMessage.scannedBy)
          ? lastMashupMessage.scannedBy
          : [lastMashupMessage.scannedBy]
        : [];

      const thisUserExists = scannedByUsers.includes(new Types.ObjectId(user.id));

      if (lastMashupMessage && thisUserExists) {
        const io = socketManager.getIo();
        if (io) {
          const receiverId = socketManager.getSocketId(user.id);
          if (receiverId) {
            io.to(receiverId).emit("unlock-conversation", conversation._id);
          }
        }
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  getBlockedUsers: async ({ context: { user } }: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const blockedUsers = await conversationService.getBlockedUsers(user.id);

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: blockedUsers,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  leaveConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      if (!conversation.isGroup) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
          error: "You can't leave a non-group conversation",
        });
      }

      const updatedConversation = await conversationService.leaveConversation(user.id, conversationId);

      await userService.decrementChatCount([user.id]);

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: updatedConversation,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },
};
