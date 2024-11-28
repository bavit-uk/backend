import { user } from "./../routes/user.route";
import { getAccessTokenFromHeaders } from "@/utils/headers.util";
import { jwtVerify } from "@/utils/jwt.util";
import { sendFCM } from "@/utils/send-fcm.util";
import { Server as HttpServer } from "http";
import mongoose, { Types } from "mongoose";
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
  private groupRooms: Map<string, Set<string>> = new Map();

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
        console.log("No access token");
        return next(new Error("Authentication error"));
      }

      next();
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

    this.setupMessageHandler(socketWithUser);
    this.setupDisconnectHandler(socketWithUser);
    this.setupGroupChatHandlers(socketWithUser);
  }

  private setupGroupChatHandlers(socket: SocketWithUser): void {
    socket.on("joinGroup", async (conversationId: string) => {
      if (!this.groupRooms.has(conversationId)) {
        this.groupRooms.set(conversationId, new Set());
      }
      this.groupRooms.get(conversationId)!.add(socket.user.id);
      socket.join(conversationId);
      this.io!.to(conversationId).emit("userJoinedGroup", { userId: socket.user.id, groupId: conversationId });
    });

    socket.on("leaveGroup", async (conversationId: string) => {
      const group = this.groupRooms.get(conversationId);
      if (group) {
        group.delete(socket.user.id);
        if (group.size === 0) {
          this.groupRooms.delete(conversationId);
        }
      }
      socket.leave(conversationId);
      this.io!.to(conversationId).emit("userLeftGroup", { userId: socket.user.id, groupId: conversationId });
    });
  }

  private setupMessageHandler(socket: SocketWithUser): void {
    socket.on(
      "message",
      async (conversationId: string, message: string, files?: any[], lockChat: boolean = false) => {}
    );

    socket.on(
      "groupMessage",
      async (conversationId: string, message: string, files?: string[], lockChat: boolean = false) => {}
    );
  }

  private setupDisconnectHandler(socket: SocketWithUser): void {
    socket.on("disconnect", () => {
      this.removeConnection(socket.user.id);
      // Remove user from each connected group
      this.groupRooms.forEach((group, groupId) => {
        if (group.has(socket.user.id)) {
          group.delete(socket.user.id);
          if (group.size === 0) {
            this.groupRooms.delete(groupId);
          }
          this.io!.to(groupId).emit("userLeftGroup", { userId: socket.user.id, groupId });
        }
      });
      console.log("A user disconnected");
    });
  }

  run = async (server: HttpServer): Promise<void> => {
    this.initializeServer(server);
    this.setupMiddleware();
    this.io!.on("connection", this.handleConnection.bind(this));
    console.log("Socket.io server is up and running");

    if (process.env.NODE_ENV === "dev") {
      const TIME_INTERVAL = 60 * 1000;
      setInterval(() => {
        console.log("Group rooms", this.groupRooms);
        console.log("Connections", this.connections);
      }, TIME_INTERVAL);
    }
  };
}

export const socketManager = new SocketManager();
