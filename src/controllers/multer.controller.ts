import { IBodyRequest } from "@/contracts/request.contract";
import { Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

export const multerController = {
  upload: async (
    req: IBodyRequest<{
      files: Express.Multer.File[];
    }>,
    res: Response
  ) => {
    if (!req.files?.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    // const url = `${req.protocol}://${req.get("host")}/uploads/${req.files.filename}`;

    // Object.assign(req.files, { url });

    if (Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        Object.assign(file, {
          url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
        });
      });
    } else {
      Object.assign(req.files, {
        url: `${req.protocol}://${req.get("host")}/uploads/${req.files.filename}`,
      });
    }

    res.status(StatusCodes.OK).json({
      message: ReasonPhrases.OK,
      status: StatusCodes.OK,
      files: req.files,
    });
  },
};
