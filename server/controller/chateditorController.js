import userModel from "../model/userModel.js";
import chatModel from "../model/CommonEditor.js";

// Create a new Chat
export const createChat = async (req, res) => {
  try {
    let { userId, studentName, studentEmail, chat, heading } = req.body;

    // Validation
    if (!userId || !studentName || !chat || !heading) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    // Verify student exists
    const student = await userModel.findById(userId);
    if (!student) {
      return res.json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.userType !== "student") {
      return res.json({
        success: false,
        message: "Selected user is not a student",
      });
    }

    // If email is not provided, get it from user model
    if (!studentEmail) {
      studentEmail = student.email;
    }

    // Create new chat
    const newChat = new chatModel({
      userId,
      heading,
      studentName,
      studentEmail,
      chat,
      createdBy: req.user?._id,
    });

    await newChat.save();

    return res.json({
      success: true,
      message: "Chat saved successfully",
      data: newChat,
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all chats for a specific student
export const getStudentChats = async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await chatModel
      .find({ userId })
      .sort({ createdAt: -1 }) // Most recent first
      .populate("createdBy", "name email"); // Populate creator info

    return res.json({
      success: true,
      message: "Chats fetched successfully",
      data: chats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all chats (admin view)
export const getAllChats = async (req, res) => {
  try {
    const chats = await chatModel
      .find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email userType")
      .populate("createdBy", "name email");

    return res.json({
      success: true,
      message: "All chats fetched successfully",
      data: chats,
    });
  } catch (error) {
    console.error("Error fetching all chats:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Mark chat as read
export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await chatModel.findByIdAndUpdate(
      chatId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!chat) {
      return res.json({
        success: false,
        message: "Chat not found",
      });
    }

    return res.json({
      success: true,
      message: "Chat marked as read",
      data: chat,
    });
  } catch (error) {
    console.error("Error marking chat as read:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update a chat
export const updateChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { chat, heading } = req.body;

    if (!chat) {
      return res.json({
        success: false,
        message: "Chat content is required",
      });
    }

    const updatedChat = await chatModel.findByIdAndUpdate(
      chatId,
      { chat, heading },
      { new: true, runValidators: true }
    );

    if (!updatedChat) {
      return res.json({
        success: false,
        message: "Chat not found",
      });
    }

    return res.json({
      success: true,
      message: "Chat updated successfully",
      data: updatedChat,
    });
  } catch (error) {
    console.error("Error updating chat:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete a chat
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const deletedChat = await chatModel.findByIdAndDelete(chatId);

    if (!deletedChat) {
      return res.json({
        success: false,
        message: "Chat not found",
      });
    }

    return res.json({
      success: true,
      message: "Chat deleted successfully",
      data: deletedChat,
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
