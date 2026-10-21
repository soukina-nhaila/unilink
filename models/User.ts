// models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    avatar?: string;
    coverImage?: string;
    department: string;
    level: string;
    bio: string;
    university: string;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    isOnline: boolean;
    notificationPrefs: {
        newFollowers: boolean;
        likes: boolean;
        comments: boolean;
        mentions: boolean;
        directMessages: boolean;
        weeklyDigest: boolean;
    };
    privacySettings: {
        privateAccount: boolean;
        showEmail: boolean;
        allowMessages: boolean;
        appearInSearch: boolean;
    };
    theme: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        firstName:      { type: String, required: true, trim: true, maxlength: 50 },
        lastName:       { type: String, required: true, trim: true, maxlength: 50 },
        email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash:   { type: String, required: true },
        avatar:         { type: String, default: "" },
        coverImage:     { type: String, default: "" },
        department:     { type: String, required: true },
        level:          { type: String, required: true, enum: ["L1","L2","L3","M1","M2","Doctorat"] },
        bio:            { type: String, default: "", maxlength: 300 },
        university:     { type: String, default: "Université Mohammed V" },
        followersCount: { type: Number, default: 0, min: 0 },
        followingCount: { type: Number, default: 0, min: 0 },
        postsCount:     { type: Number, default: 0, min: 0 },
        isOnline:       { type: Boolean, default: false },
        notificationPrefs: {
            newFollowers:   { type: Boolean, default: true },
            likes:          { type: Boolean, default: true },
            comments:       { type: Boolean, default: true },
            mentions:       { type: Boolean, default: true },
            directMessages: { type: Boolean, default: false },
            weeklyDigest:   { type: Boolean, default: false },
        },
        privacySettings: {
            privateAccount:  { type: Boolean, default: false },
            showEmail:       { type: Boolean, default: false },
            allowMessages:   { type: Boolean, default: true },
            appearInSearch:  { type: Boolean, default: true },
        },
        theme:    { type: String, default: "violet" },
        language: { type: String, default: "fr" },
    },
    { timestamps: true }
);

UserSchema.index({ firstName: "text", lastName: "text", bio: "text", department: "text" });
UserSchema.index({ department: 1, level: 1 });

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;