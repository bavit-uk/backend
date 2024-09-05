import { AddParkingLotPayload } from "@/contracts/parking-lot.contract";
import { IBodyRequest, ICombinedRequest, IUserRequest } from "@/contracts/request.contract";
import { NextFunction, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { isValidObjectId } from "mongoose";

export const parkingLotValidation = {
  addParkingLot: async (req: IBodyRequest<AddParkingLotPayload>, res: Response, next: NextFunction) => {
    try {
      const issues = [];

      if (!req.body.name) {
        issues.push("Name is required but it was not provided");
      }

      if (issues.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: issues.join(", "),
          issues,
        });
      }

      next();
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }
  },

  updateParkingLot: async (
    req: ICombinedRequest<IUserRequest, AddParkingLotPayload, { id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const issues = [];

      if (!req.body.name) {
        issues.push("Name is required but it was not provided");
      }

      if (!req.params.id) {
        issues.push("ID is required but it was not provided");
      } else {
        if (!isValidObjectId(req.params.id)) {
          issues.push("ID is not valid");
        }
      }

      if (issues.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
          issueMessage: issues.join(", "),
          issues,
        });
      }

      next();
    } catch (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }
  },
};
