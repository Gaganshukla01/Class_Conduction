import mongoose from "mongoose";

// The database name is NEVER hard-coded. It comes from MONGODB_DB_NAME, or - if that is not set - from
// the database part of MONGODB_URI (mongodb+srv://user:pass@host/<name>?...). With neither, we stop
// with a clear message instead of silently using MongoDB's default "test" database.
export const resolveDbName = (uri = process.env.MONGODB_URI, explicit = process.env.MONGODB_DB_NAME) => {
  if (explicit && explicit.trim()) return explicit.trim();
  try {
    const name = new URL(uri).pathname.replace(/^\//, "").trim();
    if (name) return decodeURIComponent(name);
  } catch { /* not a parsable URI */ }
  return "";
};

const connectDb = async () => {
  try {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set.");
    const dbName = resolveDbName();
    if (!dbName) throw new Error("No database name. Set MONGODB_DB_NAME in the environment (or put the name in MONGODB_URI after the host, e.g. ...mongodb.net/mydb?...).");
    await mongoose.connect(process.env.MONGODB_URI, { dbName });
    console.log(`Database is connected: ${dbName}`);
  } catch (error) {
    console.error("Database connection error:", error.message || error);
    process.exit(1);
  }
};

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

export default connectDb;
