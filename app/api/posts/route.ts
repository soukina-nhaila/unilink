import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser, err } from "@/lib/auth.server";
import Post from "@/models/Post";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;



  const {
    content,
    tags,
    images,
    location,
    poll
  } = await req.json();
  if (!content?.trim()) return err(400, "Le contenu est requis");

  await User.findByIdAndUpdate(auth.user._id, { $inc: { postsCount: 1 } });
  const post = await Post.create({
    author: auth.user._id,
    content,
    tags: tags || [],
    images: images || [],
    location: location || "",
    poll: poll || undefined,
  });

  const populated = await post.populate("author");
  return Response.json({
    id:            post._id.toString(),
    author:        sanitizeUser(auth.user),
    content:       post.content,
    images:        post.images,
    tags:          post.tags,
    likesCount:    0,
    commentsCount: 0,
    sharesCount:   0,
    isTrending:    false,
    isLiked:       false,
    isSaved:       false,
    createdAt:     post.createdAt,
  }, { status: 201 });


}
