import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, err } from "@/lib/auth.server";
import Post from "@/models/Post";
import Like from "@/models/Like";
import Notification from "@/models/Notification";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const post = await Post.findById(params.id);
  if (!post) return err(404, "Publication introuvable");
  const exists = await Like.findOne({ user: auth.user._id, post: params.id });
  if (exists) return err(409, "Déjà aimé");
  await Like.create({ user: auth.user._id, post: params.id });
  post.likesCount += 1;
  await post.save();
  if (post.author.toString() !== auth.user._id.toString()) {
    await Notification.create({ recipient: post.author, actor: auth.user._id, type: "like", post: params.id });
  }
  return Response.json({ liked: true, likesCount: post.likesCount });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const post = await Post.findById(params.id);
  if (!post) return err(404, "Publication introuvable");
  const like = await Like.findOneAndDelete({ user: auth.user._id, post: params.id });
  if (!like) return err(404, "Like introuvable");
  post.likesCount = Math.max(0, post.likesCount - 1);
  await post.save();
  return Response.json({ liked: false, likesCount: post.likesCount });
}
