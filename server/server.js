import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import "dotenv/config"
import connectDb from "./config/database.js"
import {authRoute} from "./router/authRouter.js"
import { userRoutes } from "./router/userRouter.js"
import { courseRouter } from "./router/courseRouter.js"
import { classScheduleRouter } from "./router/classScheduleRouter.js" 
import { noteRouter } from "./router/noteRouter.js"
import { homeworkRouter } from "./router/homeworkRouter.js"
import { codeSaveRouter } from "./router/codeSave.js"


const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000', 
  'http://localhost:5173',
  'https://class-conduction-a8ar.vercel.app',
]
console.log('Allowed origins:', allowedOrigins) // Debug log
console.log('FRONTEND_URL env var:', process.env.FRONTEND_URL) 

const app=express()
const port=process.env.PORT||4000

app.use(express.json())
const corsOptions = {
  origin: function (origin, callback) {
    
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.log('CORS blocked origin:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};
app.use(cors(corsOptions))
app.use(cookieParser())

connectDb()

app.get("/",(req,res)=>res.send("Api is Working"))

app.use("/api/auth",authRoute)
app.use("/api/user",userRoutes)
app.use("/api/course",courseRouter)
app.use("/api/classschedule",classScheduleRouter)
app.use("/api/notes",noteRouter)
app.use("/api/homework",homeworkRouter)
app.use("/api/codesave",codeSaveRouter)


app.listen(port, () => console.log(`Server is running on port ${port}`))
