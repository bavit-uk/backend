import { Types } from "mongoose";

export interface IJwtUser {
  id: Types.ObjectId;
}

export interface IAccessToken {
  accessToken: string;
  refreshToken: string;
}
