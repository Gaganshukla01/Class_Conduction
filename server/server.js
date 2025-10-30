import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import connectDb from "./config/database.js";
import { authRoute } from "./router/authRouter.js";
import { userRoutes } from "./router/userRouter.js";
import { courseRouter } from "./router/courseRouter.js";
import { classScheduleRouter } from "./router/classScheduleRouter.js";
import { noteRouter } from "./router/noteRouter.js";
import { homeworkRouter } from "./router/homeworkRouter.js";
import { codeSaveRouter } from "./router/codeSave.js";
import {contactRouter}  from "./router/contactRouter.js"

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// Define allowed origins and patterns
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://class-conduction.vercel.app",
  "https://class-conduction-hdq6.vercel.app",
];

const allowedOriginPatterns = [
  /^https:\/\/class-conduction-.*\.vercel\.app$/,
  /^https:\/\/.*-gaganshukla01s-projects\.vercel\.app$/,
];

const validOrigins = allowedOrigins.filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    // Check exact matches
    if (validOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check pattern matches
    const matchesPattern = allowedOriginPatterns.some((pattern) =>
      pattern.test(origin)
    );
    if (matchesPattern) {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cookie",
    "Set-Cookie",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());

connectDb();

app.get("/", (req, res) => res.send("Api is Working"));

app.use("/api/auth", authRoute);
app.use("/api/user", userRoutes);
app.use("/api/course", courseRouter);
app.use("/api/classschedule", classScheduleRouter);
app.use("/api/notes", noteRouter);
app.use("/api/homework", homeworkRouter);
app.use("/api/codesave", codeSaveRouter);
app.use("/api/contactus", contactRouter);

app.use((err, req, res, next) => {
  if (err.message.includes("CORS")) {
    res.status(403).json({
      error: "CORS Error",
      message: err.message,
      allowedOrigins: validOrigins,
      allowedPatterns: allowedOriginPatterns.map((p) => p.toString()),
    });
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
