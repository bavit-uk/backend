import { Router } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

export const healthcheck = (router: Router) => {
  router.get("/", (req, res) => {
    res.status(StatusCodes.OK).json({
      message: ReasonPhrases.OK,
      status: StatusCodes.OK,
    });
  });
};
