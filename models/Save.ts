import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISave extends Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SaveSchema = new Schema<ISave>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true }
);

SaveSchema.index({ user: 1, post: 1 }, { unique: true });

const Save: Model<ISave> =
  mongoose.models.Save || mongoose.model<ISave>("Save", SaveSchema);

export default Save;
