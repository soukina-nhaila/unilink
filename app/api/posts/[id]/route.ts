import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser, err } from "@/lib/auth.server";
import Post from "@/models/Post";
import Like from "@/models/Like";
import Save from "@/models/Save";
import Comment from "@/models/Comment";
import User from "@/models/User";
import mongoose from "mongoose";

async function buildPost(postId: string, viewerId: string) {
  const post = await Post.findById(postId).populate("author").lean() as any;
  if (!post) return null;
  const [liked, saved] = await Promise.all([
    Like.exists({ user: viewerId, post: postId }),
    Save.exists({ user: viewerId, post: postId }),
  ]);
  return {
    id: post._id.toString(), author: sanitizeUser(post.author),
    content: post.content, images: post.images, tags: post.tags,
    likesCount: post.likesCount, commentsCount: post.commentsCount, sharesCount: post.sharesCount,
    isTrending: post.isTrending, isLiked: !!liked, isSaved: !!saved, createdAt: post.createdAt,
  };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const post = await buildPost(params.id, auth.user._id.toString());
  if (!post) return err(404, "Publication introuvable");
  return Response.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const post = await Post.findById(params.id);
  if (!post) return err(404, "Publication introuvable");
  if (post.author.toString() !== auth.user._id.toString()) return err(403, "Non autorisé");
  const { content, tags } = await req.json();
  if (content) post.content = content;
  if (tags)    post.tags    = tags;
  await post.save();
  return Response.json(await buildPost(params.id, auth.user._id.toString()));
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const post = await Post.findById(params.id);
  if (!post) return err(404, "Publication introuvable");
  if (post.author.toString() !== auth.user._id.toString()) return err(403, "Non autorisé");
  await Promise.all([
    post.deleteOne(),
    Like.deleteMany({ post: params.id }),
    Save.deleteMany({ post: params.id }),
    Comment.deleteMany({ post: params.id }),
    User.findByIdAndUpdate(auth.user._id, { $inc: { postsCount: -1 } }),
  ]);
  return Response.json({ message: "Publication supprimée" });
}
