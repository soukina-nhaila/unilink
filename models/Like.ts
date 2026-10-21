import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILike extends Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true }
);

LikeSchema.index({ user: 1, post: 1 }, { unique: true });
LikeSchema.index({ post: 1 });

const Like: Model<ILike> =
  mongoose.models.Like || mongoose.model<ILike>("Like", LikeSchema);

export default Like;
