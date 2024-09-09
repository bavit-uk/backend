import { IBodyRequest } from "@/contracts/request.contract";
import { Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

export const multerController = {
  upload: async (
    req: IBodyRequest<{
      file: Express.Multer.File;
    }>,
    res: Response
  ) => {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    Object.assign(req.file, { url });

    res.status(StatusCodes.OK).json({
      message: ReasonPhrases.OK,
      status: StatusCodes.OK,
      file: req.file,
    });
  },
};
