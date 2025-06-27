import express from "express"
import userAuth from "../middlewares/userAuthMiddleware.js"
import { userData,updateUserTypeAlt,getAllUsers } from "../controller/userController.js"

export const userRoutes=express.Router()

userRoutes.get("/data",userAuth,userData)
userRoutes.put("/usertypeupdate",updateUserTypeAlt)
userRoutes.get("/getalluser",userAuth,getAllUsers)