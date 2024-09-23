import { IUser } from "@/contracts/user.contract";
import { CreateConversationPayload, UpdateConversationPayload } from "@/contracts/conversation.contract";
import { ICombinedRequest, IContextRequest, IParamsRequest, IUserRequest } from "@/contracts/request.contract";
import { Conversation } from "@/models/conversation.model";
import { conversationService, messageService } from "@/services";
import { Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

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

      if (alreadyExists) {
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

      body.members = [...new Set([...conversation.members, ...(body.members || [])])];
      body.isGroup = body.members.length > 2 ? true : body.isGroup;

      const updatedConversation = await conversationService.updateConversation(user.id, conversationId, body);

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
      console.log("conversation", conversation);
      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const messages = await messageService.getAll({ conversation: new Types.ObjectId(conversationId) });
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

      const blockedConversation = await conversationService.blockConversation(user.id, conversationId);

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

      const unblockedConversation = await conversationService.unblockConversation(user.id, conversationId);

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
};
