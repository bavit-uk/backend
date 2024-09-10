import { IMessage } from "@/contracts/message.contract";
import { Schema, model } from "mongoose";

const schema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: [true, "Sender is required"] },
    content: {
      type: String,
      required: function () {
        return !this.files || this.files.length === 0;
      },
      default: "",
    },
    files: {
      type: [String],
      required: function () {
        return !this.content || this.content === "";
      },
      default: [],
    },
    read: { type: Boolean, default: false },
    sent: { type: Boolean, default: true },
    received: { type: Boolean, default: false },
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: [true, "Conversation is required"] },
  },
  { timestamps: true }
);

schema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  return obj;
};

export const Message = model<IMessage>("Message", schema);
