import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser, err } from "@/lib/auth.server";
import User from "@/models/User";
import Follow from "@/models/Follow";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  // ── CORRECTION : résoudre "me" en vrai ID ─────────────────────────────────
  const targetId = params.id === "me" ? auth.user._id.toString() : params.id;

  if (!await User.exists({ _id: targetId })) return err(404, "Utilisateur introuvable");

  const follows = await Follow.find({ follower: targetId }).populate("following").lean() as any[];
  const myFollows = await Follow.find({ follower: auth.user._id }, "following").lean() as any[];
  const myFollowSet = new Set(myFollows.map((f: any) => f.following.toString()));

  const users = follows
      .filter((f: any) => f.following != null) // guard utilisateur supprimé
      .map((f: any) => ({
        ...sanitizeUser(f.following as any),
        isFollowing: myFollowSet.has(f.following._id.toString()),
      }));

  return Response.json({ users });
}