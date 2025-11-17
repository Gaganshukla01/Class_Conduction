import express from "express";
import {
  getRatingById,
  getAllRatings,
  createRating,
} from "../controller/ratingController.js";
import userAuth from "../middlewares/userAuthMiddleware.js";

export const ratingRouter = express.Router();

ratingRouter.post("/", userAuth, createRating);
ratingRouter.get("/", userAuth, getAllRatings);
