import { conversationModel } from "../models/conversation.model.js";
import { messageModel } from "../models/message.model.js";
import { listingModel } from "../models/listing.model.js";
import { notificationModel } from "../models/notification.model.js";
import { emitToUser } from "../sockets/server.socket.js";

// Start or retrieve a conversation for a specific book listing
export async function createConversationController(req, res) {
  try {
    const { listingId } = req.body;

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

    if (sellerId === buyerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot start a conversation with your own listing",
      });
    }

    // Check if conversation already exists for this listing and buyer
    let conversation = await conversationModel.findOne({
      listing: listingId,
      participants: { $all: [req.user._id, listing.seller] },
    });

    if (!conversation) {
      conversation = await conversationModel.create({
        listing: listingId,
        participants: [req.user._id, listing.seller],
      });
    }

    res.status(201).json({
      success: true,
      message: "Conversation ready",
      data: { conversation },
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

// Get all active conversations for the logged in user
export async function getConversationsController(req, res) {
  try {
    const conversations = await conversationModel
      .find({ participants: req.user._id })
      .populate("participants", "name collegeName ProfilePicture isVerified sellerStatus")
      .populate("listing", "title price images condition status")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

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
    });
  }
}

// Send a message within a conversation
export async function sendMessageController(req, res) {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID and content are required",
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
    const isParticipant = conversation.participants.includes(req.user._id);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to send messages in this conversation",
      });
    }

    // Save message
    const message = await messageModel.create({
      conversation: conversationId,
      sender: req.user._id,
      content,
    });

    // Update conversation metadata
    conversation.lastMessage = message._id;
    await conversation.save();

    // Identify recipient
    const recipientId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    // Dispatch Socket message
    emitToUser(recipientId, "new_message", {
      conversationId,
      message: {
        id: message._id,
        sender: req.user._id,
        content: message.content,
        createdAt: message.createdAt,
      },
    });

    // Save database notification
    await notificationModel.create({
      recipient: recipientId,
      type: "message",
      message: `${req.user.name} sent a message: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
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

    const isParticipant = conversation.participants.includes(req.user._id);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this conversation messages",
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
    });
  }
}
