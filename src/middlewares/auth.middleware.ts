import { NextFunction, Request, Response } from "express";

import { getAccessTokenFromHeaders } from "@/utils/headers.util";
import { jwtVerify } from "@/utils/jwt.util";
import { userService } from "@/services";

export const authMiddleware = async (req: Request, _: Response, next: NextFunction): Promise<void> => {
  try {
    Object.assign(req, { context: {} });

    const { accessToken } = getAccessTokenFromHeaders(req.headers);
    if (!accessToken) return next();

    const { id } = jwtVerify({ accessToken });
    if (!id) return next();

    const user = await userService.getById(id.toString(), "+password");
    if (!user) return next();

    Object.assign(req, {
      context: {
        user,
        accessToken,
      },
    });

    return next();
  } catch (error) {
    Object.assign(req, { context: {} });
    return next();
  }
};
