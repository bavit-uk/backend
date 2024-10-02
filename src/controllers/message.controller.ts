import { IContextRequest, IUserRequest } from "@/contracts/request.contract";
import { messageService } from "@/services";
import { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

export const messageController = {
  getAllSentByUser: async (req: IContextRequest<IUserRequest>, res: Response) => {
    const { user } = req.context;
    const messages = await messageService.getAllMashupsSentByUser(user.id);
    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ReasonPhrases.OK,
      data: messages,
    });
  },
  getAllReceivedByUser: async (req: IContextRequest<IUserRequest>, res: Response) => {
    const { user } = req.context;
    const messages = await messageService.getAllMashupsReceivedByUser(user.id);
    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ReasonPhrases.OK,
      data: messages,
    });
  },
};
