// One-off, safe to repeat:  node scripts/migrate-approvals.js
// Marks every account that existed BEFORE the approval system as "approved".
// (The app already treats a missing accountStatus as approved, so this only makes the data explicit.)
import "dotenv/config";
import mongoose from "mongoose";
import userModel from "../model/userModel.js";

try {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "ClassWave" });
  const res = await userModel.updateMany(
    { accountStatus: { $exists: false } },
    { $set: { accountStatus: "approved", approvedAt: new Date() } }
  );
  console.log(`Existing accounts marked approved: ${res.modifiedCount}`);
  const byStatus = await userModel.aggregate([{ $group: { _id: "$accountStatus", n: { $sum: 1 } } }]);
  console.table(byStatus.map((r) => ({ status: r._id, users: r.n })));
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
