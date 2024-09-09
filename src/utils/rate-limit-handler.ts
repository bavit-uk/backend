import { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

export const rateLimitHandler = (_: Request, res: Response): Response => {
  return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
    message: ReasonPhrases.TOO_MANY_REQUESTS,
    status: StatusCodes.TOO_MANY_REQUESTS,
  });
};
