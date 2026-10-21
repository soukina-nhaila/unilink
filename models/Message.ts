import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  read: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content:  { type: String, required: true, maxlength: 2000 },
    read:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
MessageSchema.index({ receiver: 1, read: 1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
