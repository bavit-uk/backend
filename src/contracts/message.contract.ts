import { Types } from "mongoose";

export interface IMessage {
  id: Types.ObjectId;
  content?: string;
  sender: Types.ObjectId;
  files?: any[];
  sent: boolean;
  received: boolean;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  conversation: Types.ObjectId;
  isQrCode: boolean;
  scannedBy: Types.ObjectId | Types.ObjectId[];
  isNotification: boolean;
}

export type GetMessagePayload = Pick<IMessage, "conversation" | "id">;

export type CreateMessagePayload = Pick<
  IMessage,
  "content" | "files" | "conversation" | "sender" | "isQrCode" | "scannedBy"
> &
  Partial<Pick<IMessage, "isNotification">>;

export type UpdateMessagePayload = Partial<Pick<IMessage, "content" | "files" | "scannedBy">> &
  Pick<IMessage, "conversation" | "id">;
