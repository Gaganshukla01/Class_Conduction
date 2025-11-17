import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ratingSchema.index({ userId: 1, createdAt: -1 });

const ratingModel =
  mongoose.models.rating || mongoose.model("rating", ratingSchema);

export default ratingModel;
