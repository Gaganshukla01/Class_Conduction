import express from "express";
import {
  gamePost,
  specificGame,
  userGameHist,
  userBest,
  overallResult,
} from "../controller/gameController.js";

export const gameRouter = express.Router();

gameRouter.post("/result", gamePost);
gameRouter.get("/leaderboard/:gameName", specificGame);
gameRouter.get("/results/user/:userId", userGameHist);
gameRouter.get("/results/user/:userId/best", userBest);
gameRouter.get("leaderboard/overall", overallResult);
