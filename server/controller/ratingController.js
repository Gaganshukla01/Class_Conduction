import ratingModel from "../model/reviewModel.js";
import userModel from "../model/userModel.js"; 

// POST - Create a new rating/comment
export const createRating = async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;

    // Validate required fields
    if (!userId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Find user to get userName
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create new rating
    const newRating = new ratingModel({
      userId,
      userName: user.name, 
      rating,
      comment,
    });

    await newRating.save();

    res.status(201).json({
      success: true,
      message: "Rating created successfully",
      data: newRating,
    });
  } catch (error) {
    console.error("Error creating rating:", error);
    res.status(500).json({
      success: false,
      message: "Error creating rating",
      error: error.message,
    });
  }
};

// GET - Get all ratings/comments
export const getAllRatings = async (req, res) => {
  try {
    const { language, userId, limit, page } = req.query;

    // Build query filter
    const filter = {};
    if (language) filter.language = language;
    if (userId) filter.userId = userId;

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get ratings with population
    const ratings = await ratingModel
      .find(filter)
      .populate("userId", "name email") // Populate user details
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await ratingModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Ratings fetched successfully",
      data: ratings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching ratings",
      error: error.message,
    });
  }
};

// GET - Get rating by ID
export const getRatingById = async (req, res) => {
  try {
    const { id } = req.params;

    const rating = await ratingModel
      .findById(id)
      .populate("userId", "name email");

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: "Rating not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Rating fetched successfully",
      data: rating,
    });
  } catch (error) {
    console.error("Error fetching rating:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching rating",
      error: error.message,
    });
  }
};