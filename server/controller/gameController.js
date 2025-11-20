import userModel from "../model/userModel.js";
import gameModel from "../model/gameModel.js";

export const gamePost = async (req, res) => {
  try {
    const { userId, userName, gameName, score, gameData } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const gameResult = new gameModel({
      userId,
      userName: userName || user.name || user.username,
      userEmail: user.email,
      gameName,
      score,
      gameData,
      playedAt: new Date(),
    });

    await gameResult.save();

    res.json({
      success: true,
      message: "Game result saved successfully",
      data: gameResult,
    });
  } catch (error) {
    console.error("Error saving game result:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save game result",
    });
  }
};

// Get user's game history
export const userGameHist = async (req, res) => {
  try {
    const { userId } = req.params;
    const results = await gameModel
      .find({ userId })
      .sort({ playedAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching user results:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch results",
    });
  }
};

// Get leaderboard for specific game
export const specificGame = async (req, res) => {
  try {
    const { gameName } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await gameModel.aggregate([
      { $match: { gameName } },
      {
        $group: {
          _id: "$userId",
          userName: { $first: "$userName" },
          userEmail: { $first: "$userEmail" },
          highestScore: { $max: "$score" },
          totalGames: { $sum: 1 },
          lastPlayed: { $max: "$playedAt" },
        },
      },
      { $sort: { highestScore: -1 } },
      { $limit: limit },
    ]);

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
    });
  }
};

// Get user's best scores for all games
export const userBest = async (req, res) => {
  try {
    const { userId } = req.params;

    const bestScores = await gameModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$gameName",
          highestScore: { $max: "$score" },
          totalGames: { $sum: 1 },
          lastPlayed: { $max: "$playedAt" },
        },
      },
      { $sort: { lastPlayed: -1 } },
    ]);

    res.json({
      success: true,
      data: bestScores,
    });
  } catch (error) {
    console.error("Error fetching best scores:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch best scores",
    });
  }
};

// Get overall leaderboard (all games combined)
export const overallResult = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const overallLeaderboard = await gameModel.aggregate([
      {
        $group: {
          _id: "$userId",
          userName: { $first: "$userName" },
          userEmail: { $first: "$userEmail" },
          totalScore: { $sum: "$score" },
          totalGames: { $sum: 1 },
          lastPlayed: { $max: "$playedAt" },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: limit },
    ]);

    res.json({
      success: true,
      data: overallLeaderboard,
    });
  } catch (error) {
    console.error("Error fetching overall leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch overall leaderboard",
    });
  }
};
