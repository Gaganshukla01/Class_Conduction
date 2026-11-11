// Usage (from the server folder):
//   node scripts/migrate-chat.js            run the migration
//   node scripts/migrate-chat.js --dry-run  only show what would happen
import "dotenv/config";
import mongoose from "mongoose";
import { migrateChat } from "../services/chatMigration.js";

const dryRun = process.argv.includes("--dry-run");
try {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "ClassWave" });
  const result = await migrateChat({ dryRun });
  console.log(dryRun ? "DRY RUN - nothing was written" : "Migration finished");
  console.table(result);
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
