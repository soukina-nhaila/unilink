import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser, err } from "@/lib/auth.server";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import Notification from "@/models/Notification";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!await Post.exists({ _id: params.id })) return err(404, "Publication introuvable");

  const comments = await Comment.find({ post: params.id })
    .sort({ createdAt: 1 })
    .populate("author")
    .lean() as any[];

  const result = comments.map((c) => ({
    id: c._id.toString(), postId: params.id,
    author: sanitizeUser(c.author),
    content: c.content, likesCount: c.likesCount, isLiked: false,
    createdAt: c.createdAt,
  }));

  return Response.json({ comments: result });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const post = await Post.findById(params.id);
  if (!post) return err(404, "Publication introuvable");

  const { content } = await req.json();
  if (!content?.trim()) return err(400, "Le contenu est requis");

  const comment = await Comment.create({ post: params.id, author: auth.user._id, content });
  post.commentsCount += 1;
  await post.save();

  if (post.author.toString() !== auth.user._id.toString()) {
    await Notification.create({ recipient: post.author, actor: auth.user._id, type: "comment", post: params.id });
  }

  return Response.json({
    id: comment._id.toString(), postId: params.id,
    author: sanitizeUser(auth.user),
    content: comment.content, likesCount: 0, isLiked: false,
    createdAt: comment.createdAt,
  }, { status: 201 });
}
