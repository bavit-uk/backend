import { conversationService, messageService, userService } from "@/services";
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
      console.log("Leave group", conversationId);
      const group = this.groupRooms.get(conversationId);
      if (group) {
        console.log("Group before leave", group);
        group.delete(socket.user.id);
        console.log("Group after leave", group);
        if (group.size === 0) {
          console.log("Group size is 0, deleting group");
          this.groupRooms.delete(conversationId);
        }
      }
      socket.leave(conversationId);
      this.io!.to(conversationId).emit("userLeftGroup", { userId: socket.user.id, groupId: conversationId });
      console.log("User left group", socket.user.id, conversationId);
      console.log("Updated group rooms", this.groupRooms);
    });
  }

  private setupMessageHandler(socket: SocketWithUser): void {
    socket.on("message", async (conversationId: string, message: string, files?: any[], lockChat: boolean = false) => {
      const conversation = await conversationService.getConversation(socket.user.id, conversationId);
      if (!conversation) {
        return this.io!.to(socket.id).emit("error", "Conversation not found");
      }

      if (conversation.isGroup) {
        // Throw error to say that you should use group chat API
        return this.io!.to(socket.id).emit("error", "Use group chat API to send message to group");
      }

      // Find receiver id
      const receiverMember = conversation.members.find((member) => member.id.toString() !== socket.user.id);

      if (!receiverMember?.id) {
        console.log("Receiver not found");
        return this.io!.to(socket.id).emit("error", "Receiver not found");
      }
      console.log("Receiver id", receiverMember);

      const lastMashupMessage = await messageService.findLastMashupMessage({
        conversation: new Types.ObjectId(conversationId),
      });

      let membersScanned = lastMashupMessage?.scannedBy || [];

      console.log("Members scanned", membersScanned);

      membersScanned = Array.isArray(membersScanned) ? membersScanned : [membersScanned];

      const exists = membersScanned.includes(new mongoose.Types.ObjectId(receiverMember.id.toString()));

      if (!lastMashupMessage || exists) {
        const receiverSocketId = this.getSocketId(receiverMember.id.toString());
        if (!receiverSocketId) {
          // TODO: Save message to database
          // TODO: Send push notification to receiver
          console.log("Receiver is not connected to the server");
          // return this.io!.to(socket.id).emit("error", "Receiver is not connected to the server");
        } else {
          this.io!.to(receiverSocketId).emit("message", {
            senderId: socket.user.id,
            message: message,
            conversationId,
            files,
            isQrCode: lockChat,
          });

          if (lockChat) {
            this.io!.to(receiverSocketId).emit("lock-conversation", conversationId);
          }
        }
      }

      await messageService.create({
        content: message,
        sender: new mongoose.Types.ObjectId(socket.user.id),
        conversation: new mongoose.Types.ObjectId(conversationId),
        files,
        isQrCode: lockChat,
        scannedBy: lockChat ? [new mongoose.Types.ObjectId(socket.user.id)] : [],
      });

      if (!lastMashupMessage || exists) {
        const token = await userService.getFCMToken(receiverMember.id.toString());

        if (token && receiverMember.notificationStatus) {
          const sender = await userService.getById(socket.user.id);
          const notification: {
            title: string;
            body: string;
            imageUrl?: string;
          } = {
            title: "New message from " + sender?.name,
            body: lockChat ? "Locked message" : message || "Attachment",
            imageUrl: files?.[0]?.url,
          };

          console.log("Notification", notification);

          if (notification.imageUrl === undefined) delete notification.imageUrl;

          await sendFCM({
            notification,
            data: {
              conversationId,
            },
            token,
          });
        }
      }
    });

    socket.on(
      "groupMessage",
      async (conversationId: string, message: string, files?: string[], lockChat: boolean = false) => {
        if (!conversationId) {
          return this.io!.to(socket.id).emit("error", "Group not found");
        }

        const conversation = await conversationService.getConversation(socket.user.id, conversationId);
        if (!conversation) {
          return this.io!.to(socket.id).emit("error", "Conversation not found");
        }

        let onlineUsers = conversation.members.filter((member) => this.getSocketId(member.id.toString()));
        const offlineUsers = conversation.members.filter((member) => !this.getSocketId(member.id.toString()));

        console.log("Online users", onlineUsers);

        const lastMashupMessage = await messageService.findLastMashupMessage({
          conversation: new Types.ObjectId(conversationId),
        });

        let membersScanned = lastMashupMessage?.scannedBy || [];

        console.log("Members scanned", membersScanned);

        membersScanned = Array.isArray(membersScanned) ? membersScanned : [membersScanned];

        onlineUsers = onlineUsers.filter((member) =>
          membersScanned.includes(new mongoose.Types.ObjectId(member.id.toString()))
        );

        offlineUsers.forEach((userId) => {
          //TODO Send push notification to offline users
        });

        onlineUsers.forEach((member) => {
          // Don't send message to the sender
          if (member.id.toString() === socket.user.id) {
            return;
          }
          const userSocketId = this.getSocketId(member.id.toString());
          if (userSocketId) {
            this.io!.to(userSocketId).emit("groupMessage", {
              senderId: socket.user.id,
              message: message,
              conversationId,
              files,
              isQrCode: lockChat,
            });
          }
        });

        if (lockChat) {
          const members = conversation.members.map((member) => member.id.toString());
          const membersExceptSender = members.filter((member) => member !== socket.user.id);
          membersExceptSender.forEach(async (member) => {
            const receiverSocketId = this.getSocketId(member);
            if (receiverSocketId) {
              this.io!.to(receiverSocketId).emit("lock-conversation", conversationId);
            }
          });
        }

        // Save the group message to the database
        await messageService.create({
          content: message,
          sender: new mongoose.Types.ObjectId(socket.user.id),
          conversation: new mongoose.Types.ObjectId(conversationId),
          files,
          isQrCode: lockChat,
          scannedBy: lockChat ? [new mongoose.Types.ObjectId(socket.user.id)] : [],
        });
      }
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

    setInterval(() => {
      console.log("Group rooms", this.groupRooms);
      console.log("Connections", this.connections);
    }, 5000);
  };
}

export const socketManager = new SocketManager();
