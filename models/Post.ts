// models/Post.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost extends Document {
    _id: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    content: string;
    images: string[];          // URLs des photos uploadées
    tags: string[];
    location?: string;         // ← NOUVEAU
    poll?: {                   // ← NOUVEAU
        question: string;
        options: {
            id: string;
            text: string;
            votes: number;
            voters: mongoose.Types.ObjectId[];
        }[];
        expiresAt?: Date;
        totalVotes: number;
    };
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isTrending: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PollOptionSchema = new Schema({
    id:     { type: String, required: true },
    text:   { type: String, required: true, maxlength: 100 },
    votes:  { type: Number, default: 0 },
    voters: [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { _id: false });

const PostSchema = new Schema<IPost>(
    {
        author:        { type: Schema.Types.ObjectId, ref: "User", required: true },
        content:       { type: String, required: true, maxlength: 2000 },
        images:        [{ type: String }],
        tags:          [{ type: String, trim: true }],
        location:      { type: String, default: "" },         // ← NOUVEAU
        poll: {                                                // ← NOUVEAU
            question: { type: String },
            options:  [PollOptionSchema],
            expiresAt: { type: Date },
            totalVotes: { type: Number, default: 0 },
        },
        likesCount:    { type: Number, default: 0, min: 0 },
        commentsCount: { type: Number, default: 0, min: 0 },
        sharesCount:   { type: Number, default: 0, min: 0 },
        isTrending:    { type: Boolean, default: false },
    },
    { timestamps: true }
);

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ likesCount: -1 });
PostSchema.index({ content: "text", tags: "text" });

const Post: Model<IPost> =
    mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;