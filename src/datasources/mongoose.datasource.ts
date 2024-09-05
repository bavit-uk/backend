import { connect, connection } from "mongoose";

export const mongoose = {
  run: async () => {
    try {
      if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not defined");
        process.exit(1);
      }

      await connect(process.env.MONGO_URI);
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  },

  stop: async () => {
    try {
      await connection.destroy();
      console.log("Disconnected from MongoDB");
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  },
};
