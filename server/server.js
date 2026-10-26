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
import { contactRouter } from "./router/contactRouter.js";
import { chatEditorRouter } from "./router/chatEditorRouter.js";
import { ratingRouter } from "./router/ratingController.js";
import { projectRouter } from "./router/projectRouter.js";
import { gameRouter } from "./router/gameRouter.js";
import { uploadRouter } from "./router/uploadRouter.js";
import { classNoteRouter } from "./router/classNoteRouter.js";
import { resourceRouter } from "./router/resourceRouter.js";
import { jobsRouter } from "./router/jobsRouter.js";
import { codeRunRouter } from "./router/codeRunRouter.js";
import { questionRouter } from "./router/questionRouter.js";

const app = express();
const port = process.env.PORT || 4000;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// Define allowed origins and patterns
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTED_URL, // the current .env uses this (misspelled) name
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
app.use("/api/chateditor", chatEditorRouter);
app.use("/api/rating", ratingRouter);
app.use("/api/project", projectRouter);
app.use("/api/game", gameRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/classnotes", classNoteRouter);
app.use("/api/resources", resourceRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/code", codeRunRouter);
app.use("/api/questions", questionRouter);

// Unknown API route -> JSON 404 instead of an HTML page
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  if (err.message?.includes("CORS")) {
    res.status(403).json({
      error: "CORS Error",
      message: err.message,
      allowedOrigins: validOrigins,
      allowedPatterns: allowedOriginPatterns.map((p) => p.toString()),
    });
  } else {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));

export default app;
