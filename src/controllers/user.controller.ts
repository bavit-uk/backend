import { IBodyRequest, ICombinedRequest, IParamsRequest } from "@/contracts/request.contract";
import { IUser, UserCreatePayload, UserUpdatePayload } from "@/contracts/user.contract";
import { PasswordReset } from "@/models";
import { passwordResetService, userService } from "@/services";
import { createHash } from "@/utils/hash.util";
import { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

import formData from "form-data";
import Mailgun from "mailgun.js";

export const userController = {
  getAll: async (req: Request, res: Response) => {
    const users = await userService.getAllWithPasswordRequests();

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ReasonPhrases.OK,
      data: users,
    });
  },

  getOne: async (
    req: IParamsRequest<{
      id: string;
    }>,
    res: Response
  ) => {
    const user = await userService.getById(req.params.id);

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ReasonPhrases.OK,
      data: user,
    });
  },

  create: async (req: IBodyRequest<UserCreatePayload>, res: Response) => {
    const exists = await userService.getByEmail(req.body.email);
    if (exists) {
      return res.status(StatusCodes.CONFLICT).json({
        status: StatusCodes.CONFLICT,
        message: ReasonPhrases.CONFLICT,
      });
    }

    const user = await userService.create(req.body);

    return res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      message: ReasonPhrases.CREATED,
      data: user,
    });
  },

  update: async (
    req: ICombinedRequest<unknown, UserUpdatePayload & Pick<UserCreatePayload, "password">, { id: string }>,
    res: Response
  ) => {
    if (req.body.password) {
      req.body.password = await createHash(req.body.password);
    }

    const user = await userService.updateProfileByUserId(req.params.id, req.body);

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ReasonPhrases.OK,
      data: user,
    });
  },

  updatePassword: async (req: ICombinedRequest<unknown, { password: string }, { id: string }>, res: Response) => {
    const password = await createHash(req.body.password);

    const user = await userService.updatePasswordByUserId(req.params.id, password);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: ReasonPhrases.NOT_FOUND,
      });
    }

    const passwordReset = await passwordResetService.findAllUnusedPasswordResetsByEmail(user.email);

    if (passwordReset.length) {
      await passwordResetService.updateAllUnusedPasswordResetsToUsed(user.email);
    }

    try {
      const mailgun = new Mailgun(formData);
      const mg = mailgun.client({ username: "api", key: process.env.MAILGUN_API_KEY || "" });

      const messageObject = {
        from: `HideAndSeek Support <bdc@support.rons-automotive.com>`,
        to: [user.email],
        subject: "Password Reset",
        text: "Your password has been reset",
        html: `
          <p>Your password has been reset by an admin. If you did not request this, please contact support.</p>
          <p> Your new password is: ${req.body.password}</p>

          <p>Thank you</p>
          <p>HideAndSeek Support</p>
        `,
      };

      const message = await mg.messages.create("support.rons-automotive.com", messageObject);
    } catch (err) {
      console.log(err);
    }

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ReasonPhrases.OK,
      data: user,
    });
  },

  getRegisteredContacts: async (
    req: ICombinedRequest<
      IUser,
      {
        contacts: string[];
      }
    >,
    res: Response
  ) => {
    req.body.contacts = (req.body.contacts || []).map((contact) => contact.replace(/\D/g, ""));

    let registeredContacts = await userService.getRegisteredContacts(req.body.contacts);

    const registeredMobileNumbers = registeredContacts.map((contact) => contact.mobileNumber);
    const unregisteredMobileNumbers = req.body.contacts.filter((contact) => !registeredMobileNumbers.includes(contact));

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ReasonPhrases.OK,
      data: {
        registeredMobileNumbers: registeredContacts,
        unregisteredMobileNumbers,
      },
    });
  },
};
