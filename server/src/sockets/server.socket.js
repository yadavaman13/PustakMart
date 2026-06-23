import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import envConfig from "../config/envConfig.js";
import { userModel } from "../models/user.model.js";

// Active user connections map (userId -> Set of socket.ids)
export const onlineUsers = new Map();

let ioInstance = null;

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    list[parts.shift().trim()] = decodeURI(parts.join("="));
  });
  return list;
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: envConfig.isAllowedClientOrigin,
      credentials: true,
    },
  });

  ioInstance = io;

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      let token = cookies.token;

      if (!token && socket.handshake.auth) {
        token = socket.handshake.auth.token;
      }

      if (!token && socket.handshake.headers.authorization) {
        const parts = socket.handshake.headers.authorization.split(" ");
        if (parts[0] === "Bearer" && parts[1]) {
          token = parts[1];
        }
      }

      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Verify JWT
      const decoded = jwt.verify(token, envConfig.JWT_SECRET_KEY);
      const user = await userModel.findById(decoded.id);

      if (!user || user.isBlocked || user.isDeleted) {
        return next(new Error("Access denied"));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected via socket: ${userId} (${socket.id})`);

    // Register online socket
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal room
    socket.join(userId);

    // Listen for typing events
    socket.on("typing", (data) => {
      // data: { conversationId, recipientId, isTyping }
      if (data && data.recipientId) {
        io.to(data.recipientId.toString()).emit("typing", {
          conversationId: data.conversationId,
          senderId: userId,
          isTyping: !!data.isTyping,
        });
      }
    });

    // Listen for read receipts
    socket.on("read_receipt", (data) => {
      // data: { conversationId, recipientId }
      if (data && data.recipientId) {
        io.to(data.recipientId.toString()).emit("read_receipt", {
          conversationId: data.conversationId,
          readerId: userId,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected via socket: ${userId} (${socket.id})`);
      const socketIds = onlineUsers.get(userId);
      if (socketIds) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          onlineUsers.delete(userId);
        }
      }
    });
  });

  return io;
}

// Global emitter helper to dispatch real-time events to users
export function emitToUser(userId, eventName, payload) {
  if (ioInstance && userId) {
    ioInstance.to(userId.toString()).emit(eventName, payload);
  }
}
