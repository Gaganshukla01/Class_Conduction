import mongoose from "mongoose";

const gameResultSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    gameName: {
      type: String,
      required: true,
      enum: ["memory", "reaction", "number", "tictactoe", "simon"],
      index: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    gameData: {
      type: mongoose.Schema.Types.Mixed,
    },
    playedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

gameResultSchema.index({ gameName: 1, score: -1 });
gameResultSchema.index({ userId: 1, playedAt: -1 });

const gameModel =
  mongoose.model.gameModel || mongoose.model("gameModel", gameResultSchema);
export default gameModel;
