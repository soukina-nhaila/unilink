import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser, err } from "@/lib/auth.server";
import User from "@/models/User";
import Follow from "@/models/Follow";
import Post from "@/models/Post";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const targetId = params.id === "me" ? auth.user._id.toString() : params.id;
  const user = await User.findById(targetId).lean() as any;
  if (!user) return err(404, "Utilisateur introuvable");

  // Compter depuis les vraies collections (source de vérité absolue)
  const [followersCount, followingCount, postsCount, isFollowing] = await Promise.all([
    Follow.countDocuments({ following: targetId }),
    Follow.countDocuments({ follower:  targetId }),
    Post.countDocuments({ author: targetId }),
    Follow.exists({ follower: auth.user._id, following: targetId }),
  ]);

  // Resynchroniser la DB avec await pour éviter la race condition :
  // sans await, la réponse peut partir avant que MongoDB applique le $set,
  // et la prochaine requête lirait encore les anciennes valeurs.
  await User.findByIdAndUpdate(targetId, {
    $set: { followersCount, followingCount, postsCount }
  }).catch(() => {});

  return Response.json({
    ...sanitizeUser(user as any),
    followersCount,
    followingCount,
    postsCount,
    isFollowing: !!isFollowing,
  });
}