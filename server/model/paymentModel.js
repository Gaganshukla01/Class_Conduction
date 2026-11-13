import mongoose from "mongoose";

// Running number for receipts: CW-2026-00001 ...
const counterSchema = new mongoose.Schema({ key: { type: String, unique: true }, seq: { type: Number, default: 0 } });
export const Counter = mongoose.models.counter || mongoose.model("counter", counterSchema);

export async function nextReceiptNo(date = new Date()) {
  const year = date.getUTCFullYear();
  const c = await Counter.findOneAndUpdate({ key: `receipt-${year}` }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return `CW-${year}-${String(c.seq).padStart(5, "0")}`;
}

const itemSchema = new mongoose.Schema(
  {
    classId: { type: String, required: true },
    className: String,
    classDate: Date,
    classTime: String,
    amount: { type: Number, required: true },
  },
  { _id: false }
);

// One payment = one receipt = one or more classes of ONE student, recorded by a teacher/manager/admin.
const paymentSchema = new mongoose.Schema(
  {
    receiptNo: { type: String, required: true, unique: true },
    studentId: { type: String, required: true, index: true },
    items: { type: [itemSchema], default: [] },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["cash", "upi", "bank", "card", "other"], default: "cash" },
    reference: { type: String, default: "", maxlength: 120 },
    note: { type: String, default: "", maxlength: 500 },
    recordedBy: { type: String, required: true, index: true },
    recordedByName: { type: String },
    recordedByRole: { type: String },
    status: { type: String, enum: ["paid", "voided"], default: "paid" },
    voidedAt: { type: Date },
    voidedBy: { type: String },
    voidReason: { type: String, default: "" },
  },
  { timestamps: true }
);
paymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.models.payment || mongoose.model("payment", paymentSchema);
