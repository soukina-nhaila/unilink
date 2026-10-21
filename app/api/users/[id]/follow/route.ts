import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, err } from "@/lib/auth.server";
import User from "@/models/User";
import Follow from "@/models/Follow";
import Notification from "@/models/Notification";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  if (params.id === auth.user._id.toString()) return err(400, "Impossible de se suivre soi-même");

  const target = await User.findById(params.id);
  if (!target) return err(404, "Utilisateur introuvable");

  const exists = await Follow.findOne({ follower: auth.user._id, following: params.id });
  if (exists) return err(409, "Déjà abonné");

  await Follow.create({ follower: auth.user._id, following: params.id });

  // { new: true } retourne le document APRÈS la mise à jour → compteurs exacts
  const [updatedTarget, updatedMe] = await Promise.all([
    User.findByIdAndUpdate(params.id, { $inc: { followersCount: 1 } }, { new: true }),
    User.findByIdAndUpdate(auth.user._id, { $inc: { followingCount: 1 } }, { new: true }),
    Notification.create({ recipient: params.id, actor: auth.user._id, type: "follow" }),
  ]);

  return Response.json({
    following: true,
    followersCount: updatedTarget?.followersCount ?? target.followersCount + 1,
    followingCount: updatedMe?.followingCount ?? auth.user.followingCount + 1,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const target = await User.findById(params.id);
  if (!target) return err(404, "Utilisateur introuvable");

  const follow = await Follow.findOneAndDelete({ follower: auth.user._id, following: params.id });
  if (!follow) return err(404, "Abonnement introuvable");

  // { new: true } retourne le document APRÈS la mise à jour → compteurs exacts
  const [updatedTarget, updatedMe] = await Promise.all([
    User.findByIdAndUpdate(params.id, { $inc: { followersCount: -1 } }, { new: true }),
    User.findByIdAndUpdate(auth.user._id, { $inc: { followingCount: -1 } }, { new: true }),
  ]);

  return Response.json({
    following: false,
    followersCount: updatedTarget?.followersCount ?? Math.max(0, target.followersCount - 1),
    followingCount: updatedMe?.followingCount ?? Math.max(0, auth.user.followingCount - 1),
  });
}
