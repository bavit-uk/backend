import { Types } from "mongoose";

export interface IConversation {
  id: Types.ObjectId;
  members: Types.ObjectId[];
  blocked: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isGroup: boolean;
  title?: string;
  description?: string;
  image?: string;
  archived: boolean;
  locked: boolean;
}

export type CreateConversationPayload = Pick<IConversation, "members" | "title" | "description" | "image" | "isGroup">;
export type UpdateConversationPayload = Partial<CreateConversationPayload>;
