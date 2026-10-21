import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser } from "@/lib/auth.server";
import Post from "@/models/Post";
import Like from "@/models/Like";
import Save from "@/models/Save";

export async function GET(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const viewerId = auth.user._id.toString();

  // Top hashtags (aggregate tags from all posts)
  const tagAgg = await Post.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const trendingPosts = await Post.find({ isTrending: true })
    .sort({ likesCount: -1 }).limit(10).populate("author").lean() as any[];

  const postIds = trendingPosts.map((p: any) => p._id);
  const [liked, saved] = await Promise.all([
    Like.find({ user: viewerId, post: { $in: postIds } }, "post").lean() as any,
    Save.find({ user: viewerId, post: { $in: postIds } }, "post").lean() as any,
  ]);
  const likedSet = new Set((liked as any[]).map((l: any) => l.post.toString()));
  const savedSet = new Set((saved as any[]).map((s: any) => s.post.toString()));

  const posts = trendingPosts.map((p: any) => ({
    id: p._id.toString(), author: sanitizeUser(p.author as any),
    content: p.content, images: p.images, tags: p.tags,
    likesCount: p.likesCount, commentsCount: p.commentsCount, sharesCount: p.sharesCount,
    isTrending: true,
    isLiked: likedSet.has(p._id.toString()),
    isSaved: savedSet.has(p._id.toString()),
    createdAt: p.createdAt,
  }));

  const topics = tagAgg.map((t: any) => ({
    tag: t._id,
    count: t.count,
    category: getCategoryForTag(t._id),
  }));

  return Response.json({ posts, topics });
}

function getCategoryForTag(tag: string): string {
  const map: Record<string, string> = {
    MachineLearning: "Technologie", DataScience: "Technologie", IAUniv: "Technologie",
    NextJS: "Dev Web", React: "Dev Web", WebDev: "Dev Web",
    Robotique: "Événements", Événement: "Événements",
    CoursPartage: "Entraide", Entraide: "Entraide",
    Économie: "Académique", Mathématiques: "Académique",
    Université: "Campus",
  };
  return map[tag] || "Général";
}
