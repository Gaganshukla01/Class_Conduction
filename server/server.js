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

const app=express()
const port=process.env.PORT||4000

// Parse JSON before CORS
app.use(express.json())

// More robust CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://class-conduction-a8ar.vercel.app', // Add your exact Vercel URL
  'http://localhost:3000', 
  'http://localhost:5173', 
]

// Remove any undefined values from allowedOrigins
const validOrigins = allowedOrigins.filter(Boolean)

console.log('Valid allowed origins:', validOrigins)

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl requests, Postman, etc.)
    if (!origin) {
      console.log('Request with no origin - allowing')
      return callback(null, true)
    }
    
    console.log('Request origin:', origin)
    console.log('Checking against origins:', validOrigins)
    
    if (validOrigins.includes(origin)) {
      console.log('✅ Origin allowed:', origin)
      callback(null, true)
    } else {
      console.log('❌ Origin blocked:', origin)
      console.log('Valid origins are:', validOrigins)
      callback(new Error(`CORS blocked: Origin ${origin} not allowed`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization', 
    'Cookie',
    'Set-Cookie'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200 // For legacy browser support
}

// Apply CORS before other middleware
app.use(cors(corsOptions))

// Handle preflight requests explicitly
app.options('*', cors(corsOptions))

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  if (err.message.includes('CORS')) {
    res.status(403).json({ 
      error: 'CORS Error', 
      message: err.message,
      allowedOrigins: validOrigins 
    })
  } else {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(port, () => console.log(`Server is running on port ${port}`))
