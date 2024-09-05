import mongoose from "mongoose";

export const convertToObjectId = (id: string): mongoose.ObjectId => {
  return new mongoose.SchemaTypes.ObjectId(id);
};
