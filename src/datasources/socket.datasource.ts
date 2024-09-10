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

class SocketManager {
  private connections: Map<string, string> = new Map();
  private io: Server | null = null;

  getConnections(): Map<string, string> {
    return this.connections;
  }

  setConnection(userId: string, socketId: string): void {
    this.connections.set(userId, socketId);
  }

  removeConnection(userId: string): void {
    this.connections.delete(userId);
  }

  getSocketId(userId: string): string | undefined {
    return this.connections.get(userId);
  }

  getIo(): Server | null {
    return this.io;
  }

  private initializeServer(server: HttpServer): void {
    this.io = new Server(server, {
      cors: { origin: "*" },
    });
  }

  private setupMiddleware(): void {
    this.io!.use((socket: Socket, next) => {
      const { accessToken } = getAccessTokenFromHeaders(socket.handshake.headers);
      if (!accessToken) {
        return next(new Error("Authentication error"));
      }

      try {
        const user = jwtVerify({ accessToken: accessToken });
        Object.assign(socket, { user: { id: user.id.toString() } }) as SocketWithUser;
        next();
      } catch (error) {
        console.error(error);
        next(new Error("Authentication error"));
      }
    });
  }

  private handleConnection(socket: Socket): void {
    const socketWithUser = socket as SocketWithUser;

    if (!socketWithUser.user) {
      this.io!.to(socket.id).emit("error", "Authentication error");
      socket.disconnect();
      return;
    }

    this.io!.to(socket.id).emit("message", "Welcome to the chat");
    this.setConnection(socketWithUser.user.id, socket.id);
    console.log("Connected Users list", this.connections);

    this.setupMessageHandler(socketWithUser);
    this.setupDisconnectHandler(socketWithUser);
  }

  private setupMessageHandler(socket: SocketWithUser): void {
    socket.on("message", async (message: string, receiverId: string) => {
      if (!receiverId) {
        return this.io!.to(socket.id).emit("error", "Receiver not found");
      }
      const receiverSocketId = this.getSocketId(receiverId);
      if (!receiverSocketId) {
        return this.io!.to(socket.id).emit("error", "Receiver not found");
      }

      this.io!.to(receiverSocketId).emit("message", message);

      console.log("sender id", socket.user.id);
      console.log("receiver id", receiverId);

      await messageService.create({
        content: message,
        sender: new mongoose.Types.ObjectId(socket.user.id),
        receiver: new mongoose.Types.ObjectId(receiverId),
      });
    });
  }

  private setupDisconnectHandler(socket: SocketWithUser): void {
    socket.on("disconnect", () => {
      this.removeConnection(socket.user.id);
      console.log("A user disconnected");
    });
  }

  run = async (server: HttpServer): Promise<void> => {
    this.initializeServer(server);
    this.setupMiddleware();
    this.io!.on("connection", this.handleConnection.bind(this));
    console.log("Socket.io server is up and running");
  };
}

export const socketManager = new SocketManager();
