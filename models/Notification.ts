import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  type: "like" | "comment" | "follow" | "mention" | "share";
  post?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor:     { type: Schema.Types.ObjectId, ref: "User", required: true },
    type:      { type: String, enum: ["like","comment","follow","mention","share"], required: true },
    post:      { type: Schema.Types.ObjectId, ref: "Post" },
    read:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
