import { IUser } from "./user.contract";

export type SignInPayload = Pick<IUser, "email" | "password" | "otp" | "deviceType" | "deviceUniqueId">;

export type SignUpPayload = Pick<IUser, "email" | "password" | "name"> & { role?: IUser["role"] };

export type ResetPasswordPayload = Pick<IUser, "email">;

export type NewPasswordPayload = Pick<IUser, "password">;
