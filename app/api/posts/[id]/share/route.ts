import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, err } from "@/lib/auth.server";
import Post from "@/models/Post";
import Notification from "@/models/Notification";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const post = await Post.findById(params.id);
  if (!post) return err(404, "Publication introuvable");
  post.sharesCount += 1;
  await post.save();
  if (post.author.toString() !== auth.user._id.toString()) {
    await Notification.create({ recipient: post.author, actor: auth.user._id, type: "share", post: params.id });
  }
  return Response.json({ sharesCount: post.sharesCount });
}
