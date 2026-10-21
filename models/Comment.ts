import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  likesCount: number;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    post:       { type: Schema.Types.ObjectId, ref: "Post", required: true },
    author:     { type: Schema.Types.ObjectId, ref: "User", required: true },
    content:    { type: String, required: true, maxlength: 1000 },
    likesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

CommentSchema.index({ post: 1, createdAt: 1 });

const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
