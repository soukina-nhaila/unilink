import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser } from "@/lib/auth.server";
import User from "@/models/User";
import Follow from "@/models/Follow";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const sp = new URL(req.url).searchParams;
  const q     = sp.get("q")          || "";
  const dept  = sp.get("department") || "";
  const level = sp.get("level")      || "";

  const filter: any = { _id: { $ne: auth.user._id } };
  if (q)    filter.$text = { $search: q };
  if (dept) filter.department = dept;
  if (level) filter.level    = level;

  const users = await User.find(filter).limit(20).lean() as any[];

  const ids = users.map((u: any) => u._id);
  const follows = await Follow.find({ follower: auth.user._id, following: { $in: ids } }, "following").lean() as any[];
  const followSet = new Set(follows.map((f: any) => f.following.toString()));

  const result = users.map((u: any) => ({
    ...sanitizeUser(u as any),
    isFollowing: followSet.has(u._id.toString()),
  }));

  return Response.json({ users: result });
}
