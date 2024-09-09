import { authGuard } from "@/guards";
import { authMiddleware } from "@/middlewares";
import { getAccessTokenFromHeaders } from "@/utils/headers.util";
import { jwtVerify } from "@/utils/jwt.util";
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

interface SocketWithContext extends Socket {
  user?: { id: string };
}
export const socket = {
  run: async (server: HttpServer) => {
    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    const connections = new Map<string, string>();

    io.use((socket: SocketWithContext, next) => {
      const { accessToken } = getAccessTokenFromHeaders(socket.handshake.headers);
      if (!accessToken) {
        return next(new Error("Authentication error"));
      }

      try {
        const user = jwtVerify({ accessToken: accessToken });
        Object.assign(socket, { user: { id: user.id.toString() } });
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    io.on("connection", (socket: SocketWithContext) => {
      if (!socket.user) {
        io.to(socket.id).emit("error", "Authentication error");
        return socket.disconnect();
      }

      connections.set(socket.user.id, socket.id);

      socket.on("message", (message: string, receiverId: string) => {
        if (!receiverId) {
          return io.to(socket.id).emit("error", "Receiver not found");
        }
        const receiverSocketId = connections.get(receiverId);
        if (!receiverSocketId) {
          return io.to(socket.id).emit("error", "Receiver not found");
        }

        io.to(receiverSocketId).emit("message", message);
      });

      socket.on("disconnect", () => {
        console.log("A user disconnected");
      });
    });

    console.log("Socket.io server is up and running");
  },
};
