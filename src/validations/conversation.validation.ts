import { CreateConversationPayload, UpdateConversationPayload } from "@/contracts/conversation.contract";
import { ICombinedRequest, IContextRequest, IParamsRequest, IUserRequest } from "@/contracts/request.contract";
import { getZodErrors } from "@/utils/get-zod-errors";
import { Response, NextFunction } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { z, ZodSchema } from "zod";
export const conversationValidation = {
  createConversation: async (
    {
      body: { isGroup, members, description, image, title },
      context: { user },
    }: ICombinedRequest<IUserRequest, CreateConversationPayload>,
    res: Response,
    next: NextFunction
  ) => {
    const objectIds = members?.map((member) => new Types.ObjectId(member));

    const schema: ZodSchema<CreateConversationPayload> = z.object({
      isGroup: z.boolean({
        message: "isGroup is required but was not provided",
      }),
      members: z
        .array(z.instanceof(Types.ObjectId), {
          message: "members is required but was not provided",
        })
        .min(1, "members must be at least one")
        .refine(
          (members) => {
            return members.every((member) => member !== user._id);
          },
          {
            message: "members must not contain the current user",
          }
        ),
      description: z
        .string({
          message: "description is required but was not provided",
        })
        .optional(),
      image: z
        .string({
          message: "image is required but was not provided",
        })
        .optional(),
      title: z
        .string({
          message: "title is required but was not provided",
        })
        .optional(),
    });

    try {
      const validatedData = schema.parse({ isGroup, members: objectIds, description, image, title });

      Object.assign({ isGroup, members, description, image, title }, validatedData);

      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const { message, issues } = getZodErrors(error);

        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: message,
          issues: issues,
        });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }
    }
  },
  getConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response,
    next: NextFunction
  ) => {
    const schema: ZodSchema<{ conversationId: string }> = z.object({
      conversationId: z.string(),
    });

    try {
      const validatedData = schema.parse({ conversationId });

      Object.assign({ conversationId }, validatedData);

      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const { message, issues } = getZodErrors(error);

        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: message,
          issues: issues,
        });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }
    }
  },
  updateConversation: async (
    {
      body,
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, UpdateConversationPayload, { conversationId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    const schema: ZodSchema<UpdateConversationPayload> = z.object({
      description: z.string().optional(),
      image: z.string().optional(),
      title: z.string().optional(),
      members: z.array(z.instanceof(Types.ObjectId)).optional(),
      isGroup: z.boolean().optional(),
    });

    try {
      const validatedData = schema.parse(body);

      Object.assign(body, validatedData);

      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const { message, issues } = getZodErrors(error);

        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: message,
          issues: issues,
        });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }
    }
  },

  deleteConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response,
    next: NextFunction
  ) => {
    const schema: ZodSchema<{ conversationId: string }> = z.object({
      conversationId: z.string({
        message: "Conversation ID is required but it was not provided",
      }),
    });

    try {
      const validatedData = schema.parse({ conversationId });

      Object.assign({ conversationId }, validatedData);

      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const { message, issues } = getZodErrors(error);

        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: message,
          issues: issues,
        });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }
    }
  },

  getMessages: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response,
    next: NextFunction
  ) => {
    const schema: ZodSchema<{ conversationId: string }> = z.object({
      conversationId: z.string({
        message: "Conversation ID is required but it was not provided",
      }),
    });

    try {
      const validatedData = schema.parse({ conversationId });

      Object.assign({ conversationId }, validatedData);

      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const { message, issues } = getZodErrors(error);

        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: message,
          issues: issues,
        });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }
    }
  },
  blockConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response,
    next: NextFunction
  ) => {
    const schema: ZodSchema<{ conversationId: string }> = z.object({
      conversationId: z.string({
        message: "Conversation ID is required but it was not provided",
      }),
    });

    try {
      const validatedData = schema.parse({ conversationId });

      Object.assign({ conversationId }, validatedData);

      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const { message, issues } = getZodErrors(error);

        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: message,
          issues: issues,
        });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }
    }
  },

  unblockConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response,
    next: NextFunction
  ) => {
    const schema: ZodSchema<{ conversationId: string }> = z.object({
      conversationId: z.string({
        message: "Conversation ID is required but it was not provided",
      }),
    });

    try {
      const validatedData = schema.parse({ conversationId });

      Object.assign({ conversationId }, validatedData);

      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const { message, issues } = getZodErrors(error);

        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: message,
          issues: issues,
        });
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });
      }
    }
  },
};
