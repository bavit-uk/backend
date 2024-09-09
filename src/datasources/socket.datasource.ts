import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export const socket = {
  run: async (server: HttpServer) => {
    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    const connections = new Map<string, Socket>();

    io.on("connection", (socket: Socket) => {
      connections.set(socket.id, socket);

      socket.on("message", (message: string) => {
        console.log(`Message: ${message}`);
        // socket.broadcast.emit("message", message);
        io.emit("message", message);
      });

      socket.on("disconnect", () => {
        console.log("A user disconnected");
      });
    });

    console.log("Socket.io server is up and running");
  },
};
