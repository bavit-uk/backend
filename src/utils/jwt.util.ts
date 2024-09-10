import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { IAccessToken, IJwtUser } from "@/contracts/jwt.contract";

export const jwtSign = (id: Types.ObjectId): IAccessToken => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET || "", {
    expiresIn: process.env.JWT_EXPIRATION,
  });

  const refreshToken = jwt.sign({ id }, process.env.JWT_SECRET || "", {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
  });

  return { accessToken, refreshToken };
};

export const jwtVerify = ({ accessToken }: { accessToken: string }) => {
  return jwt.verify(accessToken, process.env.JWT_SECRET || "") as IJwtUser;
};
