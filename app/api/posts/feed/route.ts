import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser } from "@/lib/auth.server";
import Post from "@/models/Post";
import Like from "@/models/Like";
import Save from "@/models/Save";
import Follow from "@/models/Follow";

export async function GET(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(req.url);
  const tab   = searchParams.get("tab")   || "forYou";
  const page  = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") || "10"));
  const skip  = (page - 1) * limit;

  let query: any = {};
  let sort: any  = { createdAt: -1 };

  if (tab === "following") {
    const follows = await Follow.find({ follower: auth.user._id }, "following");
    const ids = follows.map((f) => f.following);
    query = { author: { $in: ids } };
  } else if (tab === "popular") {
    sort = { likesCount: -1, createdAt: -1 };
  }

  const [posts, total] = await Promise.all([
    Post.find(query).sort(sort).skip(skip).limit(limit).populate("author").lean(),
    Post.countDocuments(query),
  ]);

  // Batch check likes & saves for current user
  const postIds = posts.map((p: any) => p._id);
  const [likedPosts, savedPosts] = await Promise.all([
    Like.find({ user: auth.user._id, post: { $in: postIds } }, "post").lean(),
    Save.find({ user: auth.user._id, post: { $in: postIds } }, "post").lean(),
  ]);
  const likedSet = new Set(likedPosts.map((l: any) => l.post.toString()));
  const savedSet = new Set(savedPosts.map((s: any) => s.post.toString()));
// APRÈS — filtrer les posts dont l'auteur est supprimé
  const result = posts
      .map((p: any) => {
        const author = sanitizeUser(p.author as any);
        if (!author) return null;  // auteur supprimé → ignorer
        return {
          id:            p._id.toString(),
          author,
          content:       p.content,
          images:        p.images,
          tags:          p.tags,
          likesCount:    p.likesCount,
          commentsCount: p.commentsCount,
          sharesCount:   p.sharesCount,
          isTrending:    p.isTrending,
          isLiked:       likedSet.has(p._id.toString()),
          isSaved:       savedSet.has(p._id.toString()),
          createdAt:     p.createdAt,
        };
      })
      .filter(Boolean);
  return Response.json({ posts: result, hasMore: skip + limit < total, total, page });
}
