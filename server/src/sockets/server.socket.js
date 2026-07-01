import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import envConfig from "../config/envConfig.js";
import { userModel } from "../models/user.model.js";
import { conversationModel } from "../models/conversation.model.js";
import { messageModel } from "../models/message.model.js";
import { notificationModel } from "../models/notification.model.js";

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

    // Join personal rooms
    socket.join(userId);
    socket.join(`room:${userId}`);

    // --- Socket Event Listeners ---

    // 1. send_message
    socket.on("send_message", async (data) => {
      // data: { conversationId, message }
      try {
        const { conversationId, message: messageText } = data;
        if (!conversationId || !messageText) return;

        const conversation = await conversationModel.findById(conversationId);
        if (!conversation) return;

        // Check if user is a participant
        const isBuyer = conversation.buyer.toString() === userId;
        const isSeller = conversation.seller.toString() === userId;
        if (!isBuyer && !isSeller) return;

        // Only allow messaging if status is accepted
        if (conversation.status !== "accepted") return;

        // Create Message
        const message = await messageModel.create({
          conversation: conversationId,
          sender: userId,
          message: messageText,
          messageType: "text",
        });

        // Update metadata and unread counts
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.createdAt;

        const recipientId = isBuyer ? conversation.seller.toString() : conversation.buyer.toString();
        if (isBuyer) {
          conversation.unreadCountSeller = (conversation.unreadCountSeller || 0) + 1;
        } else {
          conversation.unreadCountBuyer = (conversation.unreadCountBuyer || 0) + 1;
        }
        await conversation.save();

        const payload = {
          conversationId,
          message: {
            _id: message._id,
            sender: userId,
            message: message.message,
            messageType: "text",
            isRead: false,
            createdAt: message.createdAt,
          },
        };

        // Emit message_received to both parties
        io.to(recipientId).emit("message_received", payload);
        io.to(`room:${recipientId}`).emit("message_received", payload);
        
        socket.emit("message_received", payload); // Echo to sender

        // Emit new_message compatibility event
        const compatibilityPayload = {
          conversationId,
          message: {
            id: message._id,
            sender: userId,
            content: message.message,
            createdAt: message.createdAt,
          },
        };
        io.to(recipientId).emit("new_message", compatibilityPayload);
        io.to(`room:${recipientId}`).emit("new_message", compatibilityPayload);

        // Database Notification
        await notificationModel.create({
          recipient: recipientId,
          type: "message",
          message: `${socket.user.name}: ${messageText.substring(0, 30)}`,
        });

        // Socket Notification
        io.to(recipientId).emit("notification", {
          type: "message",
          message: `New message from ${socket.user.name}`,
        });
        io.to(`room:${recipientId}`).emit("notification", {
          type: "message",
          message: `New message from ${socket.user.name}`,
        });

      } catch (err) {
        console.error("Socket send_message error:", err);
      }
    });

    // 2. accept_conversation
    socket.on("accept_conversation", async (data) => {
      // data: { conversationId }
      try {
        const { conversationId } = data;
        const conversation = await conversationModel.findById(conversationId);
        if (!conversation) return;

        // Verify seller is accepting
        if (conversation.seller.toString() !== userId) return;
        if (conversation.status !== "pending") return;

        conversation.status = "accepted";
        await conversation.save();

        const systemMsg = await messageModel.create({
          conversation: conversation._id,
          sender: userId,
          message: "Seller accepted this request.",
          messageType: "system",
        });

        conversation.lastMessage = systemMsg._id;
        conversation.lastMessageAt = systemMsg.createdAt;
        await conversation.save();

        // Emit event to buyer
        const buyerId = conversation.buyer.toString();
        io.to(buyerId).emit("conversation_accepted", { conversationId, status: "accepted", systemMessage: systemMsg });
        io.to(`room:${buyerId}`).emit("conversation_accepted", { conversationId, status: "accepted", systemMessage: systemMsg });

        // Echo back to seller
        socket.emit("conversation_accepted", { conversationId, status: "accepted", systemMessage: systemMsg });
      } catch (err) {
        console.error("Socket accept_conversation error:", err);
      }
    });

    // 3. reject_conversation
    socket.on("reject_conversation", async (data) => {
      // data: { conversationId }
      try {
        const { conversationId } = data;
        const conversation = await conversationModel.findById(conversationId);
        if (!conversation) return;

        // Verify seller is rejecting
        if (conversation.seller.toString() !== userId) return;
        if (conversation.status !== "pending") return;

        conversation.status = "rejected";
        await conversation.save();

        const systemMsg = await messageModel.create({
          conversation: conversation._id,
          sender: userId,
          message: "Seller declined this request.",
          messageType: "system",
        });

        conversation.lastMessage = systemMsg._id;
        conversation.lastMessageAt = systemMsg.createdAt;
        await conversation.save();

        // Emit event to buyer
        const buyerId = conversation.buyer.toString();
        io.to(buyerId).emit("conversation_rejected", { conversationId, status: "rejected", systemMessage: systemMsg });
        io.to(`room:${buyerId}`).emit("conversation_rejected", { conversationId, status: "rejected", systemMessage: systemMsg });

        // Echo back to seller
        socket.emit("conversation_rejected", { conversationId, status: "rejected", systemMessage: systemMsg });
      } catch (err) {
        console.error("Socket reject_conversation error:", err);
      }
    });

    // 4. typing_start / typing_stop
    socket.on("typing_start", (data) => {
      // data: { conversationId, recipientId }
      if (data && data.recipientId) {
        io.to(data.recipientId.toString()).emit("typing_start", {
          conversationId: data.conversationId,
          senderId: userId,
        });
        io.to(`room:${data.recipientId.toString()}`).emit("typing_start", {
          conversationId: data.conversationId,
          senderId: userId,
        });
      }
    });

    socket.on("typing_stop", (data) => {
      // data: { conversationId, recipientId }
      if (data && data.recipientId) {
        io.to(data.recipientId.toString()).emit("typing_stop", {
          conversationId: data.conversationId,
          senderId: userId,
        });
        io.to(`room:${data.recipientId.toString()}`).emit("typing_stop", {
          conversationId: data.conversationId,
          senderId: userId,
        });
      }
    });

    // 5. message_read / read_receipt
    socket.on("message_read", async (data) => {
      // data: { conversationId, recipientId }
      try {
        const { conversationId, recipientId } = data;
        if (!conversationId) return;

        // Mark messages as read in DB
        await messageModel.updateMany(
          { conversation: conversationId, sender: { $ne: userId }, isRead: false },
          { $set: { isRead: true } }
        );

        // Reset unread count for socket user
        const conversation = await conversationModel.findById(conversationId);
        if (conversation) {
          const isBuyer = conversation.buyer.toString() === userId;
          if (isBuyer) {
            conversation.unreadCountBuyer = 0;
          } else {
            conversation.unreadCountSeller = 0;
          }
          await conversation.save();
        }

        if (recipientId) {
          io.to(recipientId.toString()).emit("message_read", {
            conversationId,
            readerId: userId,
          });
          io.to(`room:${recipientId.toString()}`).emit("message_read", {
            conversationId,
            readerId: userId,
          });
        }
      } catch (err) {
        console.error("Socket message_read error:", err);
      }
    });

    // Legacy support event handlers
    socket.on("typing", (data) => {
      if (data && data.recipientId) {
        io.to(data.recipientId.toString()).emit("typing", {
          conversationId: data.conversationId,
          senderId: userId,
          isTyping: !!data.isTyping,
        });
      }
    });

    socket.on("read_receipt", (data) => {
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
    ioInstance.to(`room:${userId.toString()}`).emit(eventName, payload);
  }
}
