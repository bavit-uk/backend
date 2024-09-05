import { ENUMS } from "@/constants/enum";
import { REGEX } from "@/constants/regex";
import { IBodyRequest, ICombinedRequest, IParamsRequest, IUserRequest } from "@/contracts/request.contract";
import { VehicleCheckInPayload, VehicleCheckOutPayload, VehicleUpdatePayload } from "@/contracts/vehicle.contract";
import { NextFunction, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { isValidObjectId } from "mongoose";

export const vehicleValidation = {
  addVehicle: async (req: IBodyRequest<VehicleCheckInPayload>, res: Response, next: NextFunction) => {
    try {
      const issues = [];

      if (!req.body.vin) {
        issues.push("VIN is required but it was not provided");
      } else {
        if (req.body.vin.length !== 17) {
          issues.push("VIN must be 17 characters long");
        } else if (REGEX.VIN.test(req.body.vin) === false) {
          issues.push("VIN is not valid");
        }
      }
      if (!req.body.leanHolder) {
        issues.push("Lean Holder is required but it was not provided");
      } else {
        if (REGEX.NAME.test(req.body.leanHolder) === false) {
          issues.push("Lean Holder is not valid");
        }
      }
      if (!req.body.parkingLotId) {
        issues.push("Parking Lot ID is required but it was not provided");
      } else {
        if (!isValidObjectId(req.body.parkingLotId)) {
          issues.push("Parking Lot ID is not valid");
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

  getById: async (
    req: ICombinedRequest<null, null, { id: string }, { vin?: boolean }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const issues = [];

      if (!req.params.id) {
        issues.push("ID is required but it was not provided");
      } else {
        if (req.query.vin) {
          if (!REGEX.VIN.test(req.params.id)) {
            issues.push("VIN is not valid");
          }
        } else if (!isValidObjectId(req.params.id)) {
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

  updateVehicle: async (
    req: ICombinedRequest<IUserRequest, Omit<VehicleUpdatePayload, "updateHistory">, { id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { vin, leanHolder, checkinTime, checkoutTime, isCheckOut, parkingLotId, status, statusDescription } =
        req.body;
      const issues = [];

      if (!req.params.id) {
        issues.push("ID is required but it was not provided");
      } else {
        if (!isValidObjectId(req.params.id)) {
          issues.push("ID is not valid");
        }
      }

      if (vin) {
        if (vin.length !== 17) {
          issues.push("VIN must be 17 characters long");
        } else if (REGEX.VIN.test(vin) === false) {
          issues.push("VIN is not valid");
        }
      }

      if (leanHolder) {
        if (REGEX.NAME.test(leanHolder) === false) {
          issues.push("Lean Holder is not valid");
        }
      }

      if (parkingLotId) {
        if (!isValidObjectId(parkingLotId)) {
          issues.push("Parking Lot ID is not valid");
        }
      }

      if (status) {
        if (!ENUMS.VEHICLE_STATUS.includes(status)) {
          issues.push("Status is not valid");
        }
      }

      if (isCheckOut) {
        if (typeof isCheckOut !== "boolean") {
          issues.push("Is Check Out must be a boolean");
        }
      }

      if (checkinTime) {
        if (typeof checkinTime !== "string" || new Date(checkinTime).toString() === "Invalid Date") {
          issues.push("Checkin Time is not valid");
        }
      }

      if (checkoutTime) {
        if (typeof checkoutTime !== "string" || new Date(checkoutTime).toString() === "Invalid Date") {
          issues.push("Checkout Time is not valid");
        }
      }

      if (statusDescription) {
        if (statusDescription.length < 5) {
          issues.push("Status Description must be at least 5 characters long");
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

  vehicleCheckOut: async (
    req: ICombinedRequest<IUserRequest, VehicleCheckOutPayload, { id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const issues = [];

      if (!req.params.id) {
        issues.push("ID is required but it was not provided");
      } else {
        if (!isValidObjectId(req.params.id)) {
          issues.push("ID is not valid");
        }
      }

      if (!req.body.status) {
        issues.push("Status is required but it was not provided");
      } else {
        if (!ENUMS.VEHICLE_STATUS.includes(req.body.status)) {
          issues.push("Status is not valid");
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
