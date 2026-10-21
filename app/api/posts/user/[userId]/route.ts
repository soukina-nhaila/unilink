import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser } from "@/lib/auth.server";
import Post from "@/models/Post";
import Like from "@/models/Like";
import Save from "@/models/Save";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const tab = new URL(req.url).searchParams.get("tab") || "posts";
  const viewerId = auth.user._id.toString();
  const targetId = params.userId === "me" ? viewerId : params.userId;

  let rawPosts: any[] = [];

  if (tab === "posts") {
    rawPosts = await Post.find({ author: targetId })
      .sort({ createdAt: -1 }).populate("author").lean();
  } else if (tab === "liked") {
    const likes = await Like.find({ user: targetId }).select("post").lean() as any[];
    const ids = likes.map((l: any) => l.post);
    rawPosts = await Post.find({ _id: { $in: ids } }).populate("author").lean();
  } else if (tab === "saved") {
    const saves = await Save.find({ user: targetId }).select("post").lean() as any[];
    const ids = saves.map((s: any) => s.post);
    rawPosts = await Post.find({ _id: { $in: ids } }).populate("author").lean();
  }

  const postIds = rawPosts.map((p: any) => p._id);
  const [likedPosts, savedPosts] = await Promise.all([
    Like.find({ user: viewerId, post: { $in: postIds } }, "post").lean() as any,
    Save.find({ user: viewerId, post: { $in: postIds } }, "post").lean() as any,
  ]);
  const likedSet = new Set((likedPosts as any[]).map((l: any) => l.post.toString()));
  const savedSet = new Set((savedPosts as any[]).map((s: any) => s.post.toString()));

  const posts = rawPosts.map((p: any) => ({
    id: p._id.toString(), author: sanitizeUser(p.author as any),
    content: p.content, images: p.images, tags: p.tags,
    likesCount: p.likesCount, commentsCount: p.commentsCount, sharesCount: p.sharesCount,
    isTrending: p.isTrending,
    isLiked: likedSet.has(p._id.toString()),
    isSaved: savedSet.has(p._id.toString()),
    createdAt: p.createdAt,
  }));

  return Response.json({ posts });
}
