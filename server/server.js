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
import { questionFolderRouter } from "./router/questionFolderRouter.js";
import { chatRouter } from "./router/chatRouter.js";
import { extraClassRouter } from "./router/extraClassRouter.js";
import { paymentRouter } from "./router/paymentRouter.js";
import http from "http";
import { initSocket } from "./services/socketHub.js";
import { buildOrigins, isOriginAllowed } from "./config/cors.js";

const app = express();
const port = process.env.PORT || 4000;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// Allowed origins come from the environment (FRONTEND_URL, FRONTEND_URL_WWW, CORS_ORIGINS) - see config/cors.js
const allowed = buildOrigins();
const validOrigins = allowed.exact;
if (validOrigins.length === 0 && allowed.patterns.length === 0) {
  console.warn("CORS: no allowed origins. Set FRONTEND_URL in the server environment.");
}

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin, allowed)) {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked: ${origin} is not in FRONTEND_URL / FRONTEND_URL_WWW / CORS_ORIGINS`));
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
app.use("/api/question-folders", questionFolderRouter);
app.use("/api/questions", questionRouter);
app.use("/api/chat", chatRouter);
app.use("/api/extra-classes", extraClassRouter);
app.use("/api/payments", paymentRouter);

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

// An http.Server (instead of app.listen) so Socket.io can share the port.
// On Vercel serverless the exported `app` is used and sockets stay inactive.
const server = http.createServer(app);
initSocket(server, (origin, cb) => cb(null, isOriginAllowed(origin, allowed))).finally(() => {
  server.listen(port, () => console.log(`Server is running on port ${port}`));
});

export default app;
