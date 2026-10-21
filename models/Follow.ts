import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFollow extends Document {
  follower: mongoose.Types.ObjectId;  // celui qui suit
  following: mongoose.Types.ObjectId; // celui qui est suivi
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    follower:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ follower: 1 });
FollowSchema.index({ following: 1 });

const Follow: Model<IFollow> =
  mongoose.models.Follow || mongoose.model<IFollow>("Follow", FollowSchema);

export default Follow;
