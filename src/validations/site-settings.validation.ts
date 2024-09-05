import { IBodyRequest, ICombinedRequest, IParamsRequest } from "@/contracts/request.contract";
import { AddSiteSettingsPayload, UpdateSiteSettingsPayload } from "@/contracts/site-settings.contract";
import { NextFunction, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

export const siteSettingsValidation = {
  addSiteSettings: async (req: IBodyRequest<AddSiteSettingsPayload>, res: Response, next: NextFunction) => {
    try {
      const issues = [];

      if (!req.body.type) {
        issues.push("Type is required but it was not provided");
      }

      if (!req.body.key) {
        issues.push("Key is required but it was not provided");
      }

      if (!req.body.value) {
        issues.push("Value is required but it was not provided");
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

  updateSiteSettings: async (
    req: ICombinedRequest<unknown, UpdateSiteSettingsPayload, { id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const issues = [];

      if (!req.body.value) {
        issues.push("Value is required but it was not provided");
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

  deleteSiteSettings: async (req: IParamsRequest<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const issues = [];

      if (!req.params.id) {
        issues.push("ID is required but it was not provided");
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
