import { Types } from "mongoose";

export interface IMessage {
  id: Types.ObjectId;
  content?: string;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  files?: string[];
  sent: boolean;
  received: boolean;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type GetMessagePayload = Pick<IMessage, "sender" | "receiver">;

export type CreateMessagePayload = Pick<IMessage, "content" | "sender" | "receiver" | "files">;

export type UpdateMessagePayload = Partial<CreateMessagePayload>;
