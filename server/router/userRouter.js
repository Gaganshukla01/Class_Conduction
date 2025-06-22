import express from "express"
import userAuth from "../middlewares/userAuthMiddleware.js"
import { userData } from "../controller/userController.js"

export const userRoutes=express.Router()

userRoutes.get("/data",userAuth,userData)