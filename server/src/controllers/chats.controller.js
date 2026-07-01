import mongoose from "mongoose";
import crypto from "crypto";
import { conversationModel } from "../models/conversation.model.js";
import { messageModel } from "../models/message.model.js";
import { listingModel } from "../models/listing.model.js";
import { notificationModel } from "../models/notification.model.js";
import { userModel } from "../models/user.model.js";
import { couponModel } from "../models/coupon.model.js";
import { emitToUser } from "../sockets/server.socket.js";

// Helper to generate a random coupon code
function generateCouponCode() {
  return "PM-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

// Start or retrieve a conversation for a specific book listing
export async function createConversationController(req, res) {
  try {
    const { listingId, message: introductoryMessage } = req.body;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "Listing ID is required to start a conversation",
      });
    }

    const listing = await listingModel.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const sellerId = listing.seller.toString();
    const buyerId = req.user._id.toString();

    // Rule 1: A seller cannot chat with themselves
    if (sellerId === buyerId) {
      return res.status(400).json({
        success: false,
        message: "You already own this listing. Try managing it from your seller dashboard.",
      });
    }

    // Rule 2: One Listing = One Conversation
    let conversation = await conversationModel.findOne({
      listing: listingId,
      buyer: req.user._id,
    });

    if (conversation) {
      // Retrieve conversation with participants projected for compatibility
      const populatedConv = await conversationModel.findById(conversation._id)
        .populate("buyer", "name collegeName ProfilePicture isVerified sellerStatus")
        .populate("seller", "name collegeName ProfilePicture isVerified sellerStatus")
        .populate("listing", "title price images condition status")
        .populate("lastMessage");

      const resConv = populatedConv.toObject();
      resConv.participants = [resConv.buyer, resConv.seller];

      return res.status(200).json({
        success: true,
        message: "Existing conversation loaded",
        data: { conversation: resConv },
      });
    }

    // Rule 3: Buyer Sends Chat Request -> Create Conversation pending
    conversation = await conversationModel.create({
      listing: listingId,
      buyer: req.user._id,
      seller: listing.seller,
      status: "pending",
    });

    // Rule 4: Only First Message Allowed
    const finalIntroMessage = introductoryMessage || `Hi, is this "${listing.title}" still available?`;
    const message = await messageModel.create({
      conversation: conversation._id,
      sender: req.user._id,
      message: finalIntroMessage,
      messageType: "text",
    });

    // Update conversation metadata
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    conversation.unreadCountSeller = 1;
    await conversation.save();

    // Notify Seller via Socket and Database Notification
    const buyerProfile = await userModel.findById(req.user._id).select("name collegeName ProfilePicture isVerified");
    const sellerProfile = await userModel.findById(listing.seller).select("name collegeName ProfilePicture isVerified");

    const socketPayload = {
      conversationId: conversation._id,
      buyer: buyerProfile,
      seller: sellerProfile,
      listing: {
        _id: listing._id,
        title: listing.title,
        price: listing.price,
        images: listing.images,
        condition: listing.condition,
        status: listing.status,
      },
      message: {
        _id: message._id,
        sender: req.user._id,
        message: message.message,
        messageType: message.messageType,
        createdAt: message.createdAt,
      },
    };

    // Emit conversation_request to seller's room
    emitToUser(sellerId, "conversation_request", socketPayload);

    // Save database notification
    await notificationModel.create({
      recipient: listing.seller,
      type: "message",
      message: `New buyer chat request from ${req.user.name} for "${listing.title}"`,
    });

    // Format response conversation with participants array for frontend compatibility
    const resConv = conversation.toObject();
    resConv.buyer = buyerProfile;
    resConv.seller = sellerProfile;
    resConv.listing = listing;
    resConv.lastMessage = message;
    resConv.participants = [buyerProfile, sellerProfile];

    res.status(201).json({
      success: true,
      message: "Chat request submitted successfully",
      data: { conversation: resConv },
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Error starting conversation",
      error: error.message,
    });
  }
}

// Get all active conversations for the logged in user using Aggregation Pipeline
export async function getConversationsController(req, res) {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);

    const conversations = await conversationModel.aggregate([
      {
        $match: {
          $or: [{ buyer: userObjectId }, { seller: userObjectId }],
        },
      },
      // Lookup buyer profile details
      {
        $lookup: {
          from: "users",
          localField: "buyer",
          foreignField: "_id",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
      // Lookup seller profile details
      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },
      // Lookup listing details
      {
        $lookup: {
          from: "listings",
          localField: "listing",
          foreignField: "_id",
          as: "listing",
        },
      },
      { $unwind: "$listing" },
      // Lookup last message details
      {
        $lookup: {
          from: "messages",
          localField: "lastMessage",
          foreignField: "_id",
          as: "lastMessage",
        },
      },
      {
        $unwind: {
          path: "$lastMessage",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Projection matching client and PRD needs
      {
        $project: {
          _id: 1,
          status: 1,
          unreadCountBuyer: 1,
          unreadCountSeller: 1,
          lastMessageAt: 1,
          createdAt: 1,
          updatedAt: 1,
          "buyer._id": 1,
          "buyer.name": 1,
          "buyer.ProfilePicture": 1,
          "buyer.collegeName": 1,
          "seller._id": 1,
          "seller.name": 1,
          "seller.ProfilePicture": 1,
          "seller.collegeName": 1,
          "seller.isVerified": 1,
          "listing._id": 1,
          "listing.title": 1,
          "listing.price": 1,
          "listing.images": 1,
          "listing.condition": 1,
          "listing.status": 1,
          "listing.seller": 1,
          "lastMessage._id": 1,
          "lastMessage.message": 1,
          "lastMessage.sender": 1,
          "lastMessage.isRead": 1,
          "lastMessage.messageType": 1,
          "lastMessage.createdAt": 1,
          // Generate participants list for client compatibility
          participants: ["$buyer", "$seller"],
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "Conversations fetched successfully",
      data: { conversations },
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching conversations",
      error: error.message,
    });
  }
}

// Fetch single conversation details
export async function getConversationDetailsController(req, res) {
  try {
    const { id } = req.params;
    const conversation = await conversationModel.findById(id)
      .populate("buyer", "name collegeName ProfilePicture isVerified sellerStatus")
      .populate("seller", "name collegeName ProfilePicture isVerified sellerStatus")
      .populate("listing", "title price images condition status seller")
      .populate("lastMessage");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isAuthorized =
      conversation.buyer._id.toString() === req.user._id.toString() ||
      conversation.seller._id.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this conversation",
      });
    }

    const resConv = conversation.toObject();
    resConv.participants = [resConv.buyer, resConv.seller];

    res.status(200).json({
      success: true,
      data: { conversation: resConv },
    });
  } catch (error) {
    console.error("Get conversation details error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving conversation details",
      error: error.message,
    });
  }
}

// Seller accepts chat request
export async function acceptConversationController(req, res) {
  try {
    const { id } = req.params;
    const conversation = await conversationModel.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Only the seller can accept
    if (conversation.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can accept this conversation request",
      });
    }

    if (conversation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Conversation request cannot be accepted from state: ${conversation.status}`,
      });
    }

    conversation.status = "accepted";
    await conversation.save();

    // Create system notification message in chat
    const systemMessage = await messageModel.create({
      conversation: conversation._id,
      sender: req.user._id,
      message: "Seller accepted this request.",
      messageType: "system",
    });

    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();

    // Notify Buyer via Socket
    emitToUser(conversation.buyer.toString(), "conversation_accepted", {
      conversationId: conversation._id,
      status: "accepted",
      systemMessage,
    });

    res.status(200).json({
      success: true,
      message: "Conversation request accepted",
      data: { conversation },
    });
  } catch (error) {
    console.error("Accept conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Error accepting conversation request",
      error: error.message,
    });
  }
}

// Seller rejects chat request
export async function rejectConversationController(req, res) {
  try {
    const { id } = req.params;
    const conversation = await conversationModel.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Only the seller can reject
    if (conversation.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can reject this conversation request",
      });
    }

    if (conversation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Conversation request cannot be rejected from state: ${conversation.status}`,
      });
    }

    conversation.status = "rejected";
    await conversation.save();

    // Create system notification message in chat
    const systemMessage = await messageModel.create({
      conversation: conversation._id,
      sender: req.user._id,
      message: "Seller declined this request.",
      messageType: "system",
    });

    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();

    // Notify Buyer via Socket
    emitToUser(conversation.buyer.toString(), "conversation_rejected", {
      conversationId: conversation._id,
      status: "rejected",
      systemMessage,
    });

    res.status(200).json({
      success: true,
      message: "Conversation request rejected",
      data: { conversation },
    });
  } catch (error) {
    console.error("Reject conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting conversation request",
      error: error.message,
    });
  }
}

// Seller generates coupon code for the buyer
export async function createConversationCouponController(req, res) {
  try {
    const { id } = req.params;
    const { discountAmount } = req.body;

    if (discountAmount === undefined || Number(discountAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A positive discount amount is required",
      });
    }

    const conversation = await conversationModel.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Only the seller can generate a coupon code
    if (conversation.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can generate a coupon code for this transaction",
      });
    }

    if (conversation.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Coupons can only be generated for accepted active conversations",
      });
    }

    const couponCode = generateCouponCode();

    const coupon = await couponModel.create({
      code: couponCode,
      seller: conversation.seller,
      buyer: conversation.buyer,
      listing: conversation.listing,
      conversation: conversation._id,
      discountAmount: Number(discountAmount),
      isUsed: false,
    });

    // Create system message announcing the discount
    const systemMessage = await messageModel.create({
      conversation: conversation._id,
      sender: req.user._id,
      message: `Seller offered a discount of ₹${discountAmount}! Use coupon code: ${couponCode} to buy this book at a lower price.`,
      messageType: "system",
    });

    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();

    // Emit system message to buyer
    const buyerId = conversation.buyer.toString();
    emitToUser(buyerId, "message_received", {
      conversationId: conversation._id,
      message: {
        _id: systemMessage._id,
        sender: req.user._id,
        message: systemMessage.message,
        messageType: "system",
        createdAt: systemMessage.createdAt,
      },
    });

    res.status(201).json({
      success: true,
      message: "Discount coupon generated successfully",
      data: { coupon, systemMessage },
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating discount coupon",
      error: error.message,
    });
  }
}

// Send a message within a conversation
export async function sendMessageController(req, res) {
  try {
    const { conversationId, content, message: messageText } = req.body;
    const finalContent = content || messageText;

    if (!conversationId || !finalContent) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID and message content are required",
      });
    }

    const conversation = await conversationModel.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Verify participation
    const isBuyer = conversation.buyer.toString() === req.user._id.toString();
    const isSeller = conversation.seller.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to send messages in this conversation",
      });
    }

    // Allowed only when: status === accepted
    if (conversation.status !== "accepted") {
      return res.status(403).json({
        success: false,
        message: "Messaging is locked until the seller accepts the request",
      });
    }

    // Save message
    const message = await messageModel.create({
      conversation: conversationId,
      sender: req.user._id,
      message: finalContent,
      messageType: "text",
    });

    // Update conversation last message metadata and unread counts
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;

    const recipientId = isBuyer ? conversation.seller.toString() : conversation.buyer.toString();

    if (isBuyer) {
      conversation.unreadCountSeller = (conversation.unreadCountSeller || 0) + 1;
    } else {
      conversation.unreadCountBuyer = (conversation.unreadCountBuyer || 0) + 1;
    }
    await conversation.save();

    // Dispatch socket message payload (message_received as per PRD, and compatibility new_message)
    const socketPayload = {
      conversationId,
      message: {
        _id: message._id,
        sender: req.user._id,
        message: message.message,
        messageType: message.messageType,
        isRead: false,
        createdAt: message.createdAt,
      },
    };

    const compatibilityPayload = {
      conversationId,
      message: {
        id: message._id,
        sender: req.user._id,
        content: message.message,
        createdAt: message.createdAt,
      },
    };

    emitToUser(recipientId, "message_received", socketPayload);
    emitToUser(recipientId, "new_message", compatibilityPayload);

    // Save database notification
    await notificationModel.create({
      recipient: recipientId,
      type: "message",
      message: `${req.user.name} sent a message: "${finalContent.substring(0, 30)}${finalContent.length > 30 ? "..." : ""}"`,
    });

    // Emit Socket notification
    emitToUser(recipientId, "notification", {
      type: "message",
      message: `New message from ${req.user.name}`,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: { message },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
}

// Fetch all messages in a conversation and mark them as read
export async function getMessagesController(req, res) {
  try {
    const { conversationId } = req.params;
    const conversation = await conversationModel.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isBuyer = conversation.buyer.toString() === req.user._id.toString();
    const isSeller = conversation.seller.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this conversation's messages",
      });
    }

    const messages = await messageModel
      .find({ conversation: conversationId })
      .sort({ createdAt: 1 });

    // Mark other participant's unread messages as read
    await messageModel.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id }, isRead: false },
      { $set: { isRead: true } }
    );

    // Reset unread count for this user
    if (isBuyer) {
      conversation.unreadCountBuyer = 0;
    } else {
      conversation.unreadCountSeller = 0;
    }
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: { messages },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
}
