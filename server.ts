import "dotenv/config";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import registerChatHandlers from "./socket/chatHandler";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const onlineUsers = new Map<string, Set<string>>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
    
    socket.on("user_connected", (userId: string) => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      
      const userSockets = onlineUsers.get(userId)!;
      userSockets.add(socket.id);

      if (userSockets.size === 1) {
        io.emit("user_status_change", { userId, isOnline: true });
      }
    });

    socket.on("check_user_status", (userId: string) => {
      const isOnline = onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
      socket.emit("user_status_result", { userId, isOnline });
    });

    socket.on("check_multiple_users_status", (userIds: string[]) => {
      if (!Array.isArray(userIds)) return;
      
      const statuses: Record<string, boolean> = {};
      userIds.forEach((id) => {
        statuses[id] = onlineUsers.has(id) && onlineUsers.get(id)!.size > 0;
      });

      console.log(onlineUsers);
      
      socket.emit("multiple_users_status_result", statuses);
    });

    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      for (const [userId, socketIds] of onlineUsers.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id); 
          
          if (socketIds.size === 0) {
            onlineUsers.delete(userId);
            io.emit("user_status_change", { userId, isOnline: false });
          }
          break;
        }
      }
    });

  });

  httpServer.listen(port, () => {
    console.log(`Ready on http://${hostname}:${port}`);
    console.log(`WebSocket Server is running securely`);
  });
});