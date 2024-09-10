import { Types } from "mongoose";

export interface IMessage {
  id: Types.ObjectId;
  content?: string;
  sender: Types.ObjectId;
  files?: string[];
  sent: boolean;
  received: boolean;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  conversation: Types.ObjectId;
}

export type GetMessagePayload = Pick<IMessage, "conversation" | "id">;

export type CreateMessagePayload = Pick<IMessage, "content" | "files" | "conversation">;

export type UpdateMessagePayload = Partial<Pick<IMessage, "content" | "files">> & Pick<IMessage, "conversation" | "id">;
