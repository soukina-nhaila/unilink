import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, err } from "@/lib/auth.server";
import Comment from "@/models/Comment";
import Post from "@/models/Post";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const comment = await Comment.findById(params.commentId);
  if (!comment) return err(404, "Commentaire introuvable");
  if (comment.author.toString() !== auth.user._id.toString())
    return err(403, "Non autorisé");

  await comment.deleteOne();
  await Post.findByIdAndUpdate(params.id, { $inc: { commentsCount: -1 } });

  return Response.json({ message: "Commentaire supprimé" });
}
