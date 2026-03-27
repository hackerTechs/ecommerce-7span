import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "./index";

let io: Server | undefined;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

// Emits stock updates when Socket.IO is running
export function broadcastStockUpdate(products: Array<{ id: number; stock: number }>): void {
  if (!io || products.length === 0) return;
  io.emit("stock:update", products);
}
