import { IConversation } from "@/contracts/conversation.contract";
import { Schema, model } from "mongoose";

const schema = new Schema<IConversation>(
  {
    members: { type: [Schema.Types.ObjectId], ref: "User", required: [true, "Members are required"] },
    isGroup: { type: Boolean, required: [true, "isGroup is required"] },
    blocked: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    archived: { type: Boolean, default: false },
    title: { type: String, required: [true, "Title is required"] },
    description: { type: String, required: false, default: "" },
    image: { type: String, required: false, default: "" },
  },
  { timestamps: true }
);

schema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  return obj;
};

export const Conversation = model<IConversation>("Conversation", schema);
