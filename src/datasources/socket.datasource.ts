import { messageService } from "@/services";
import { getAccessTokenFromHeaders } from "@/utils/headers.util";
import { jwtVerify } from "@/utils/jwt.util";
import { Server as HttpServer } from "http";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";

interface User {
  id: string;
}

interface SocketWithUser extends Socket {
  user: User;
}

export const socket = {
  run: async (server: HttpServer) => {
    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    const connections = new Map<string, string>();

    io.use((socket: Socket, next) => {
      const { accessToken } = getAccessTokenFromHeaders(socket.handshake.headers);
      if (!accessToken) {
        return next(new Error("Authentication error"));
      }

      try {
        const user = jwtVerify({ accessToken: accessToken });
        // Cast the socket to SocketWithUser and assign the user
        // (socket as SocketWithUser).user.id = user.id.toString();
        Object.assign(socket, { user: { id: user.id.toString() } }) as SocketWithUser;
        next();
      } catch (error) {
        console.error(error);
        next(new Error("Authentication error"));
      }
    });

    io.on("connection", (socket: Socket) => {
      // Cast the socket to SocketWithUser
      const socketWithUser = socket as SocketWithUser;

      if (!socketWithUser.user) {
        io.to(socket.id).emit("error", "Authentication error");
        return socket.disconnect();
      }

      io.to(socket.id).emit("message", "Welcome to the chat");

      connections.set(socketWithUser.user.id, socket.id);

      console.log("Connected Users list", connections);

      socket.on("message", async (message: string, receiverId: string) => {
        if (!receiverId) {
          return io.to(socket.id).emit("error", "Receiver not found");
        }
        const receiverSocketId = connections.get(receiverId);
        if (!receiverSocketId) {
          return io.to(socket.id).emit("error", "Receiver not found");
        }

        io.to(receiverSocketId).emit("message", message);

        console.log("sender id", socketWithUser.user.id);
        console.log("receiver id", receiverId);

        await messageService.create({
          content: message,
          sender: new mongoose.Types.ObjectId(socketWithUser.user.id),
          receiver: new mongoose.Types.ObjectId(receiverId),
        });
      });

      socket.on("disconnect", () => {
        console.log("A user disconnected");
      });
    });

    console.log("Socket.io server is up and running");
  },
};
