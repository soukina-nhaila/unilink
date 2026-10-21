import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser } from "@/lib/auth.server";
import User from "@/models/User";
import Follow from "@/models/Follow";

export async function GET(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const myFollows = await Follow.find({ follower: auth.user._id }, "following").lean() as any[];
  const followingIds = myFollows.map((f: any) => f.following);

  const suggestions = await User.find({
    _id: { $ne: auth.user._id, $nin: followingIds },
  }).limit(6).lean() as any[];

  return Response.json({
    users: suggestions.map((u: any) => ({ ...sanitizeUser(u as any), isFollowing: false })),
  });
}
