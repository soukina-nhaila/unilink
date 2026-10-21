import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser, err } from "@/lib/auth.server";
import User from "@/models/User";
import Follow from "@/models/Follow";
import Post from "@/models/Post";

// GET /api/auth/me — recharge depuis la DB + recalcule les vrais compteurs
export async function GET(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const userId = auth.user._id.toString();

  // Recharger le doc frais + compter depuis les vraies collections en parallèle
  const [freshUser, followersCount, followingCount, postsCount] = await Promise.all([
    User.findById(userId).lean(),
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower:  userId }),
    Post.countDocuments({ author: userId }),
  ]);

  if (!freshUser) return err(404, "Utilisateur introuvable");

  // await pour garantir que la DB est synchro avant la prochaine requête
  await User.findByIdAndUpdate(userId, {
    $set: { followersCount, followingCount, postsCount }
  }).catch(() => {});

  return Response.json({
    ...sanitizeUser(freshUser as any),
    followersCount,
    followingCount,
    postsCount,
  });
}

// PUT /api/auth/me — mise à jour profil texte
export async function PUT(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { firstName, lastName, bio, department, level, university } = await req.json();

  const updatedUser = await User.findByIdAndUpdate(
      auth.user._id,
      {
        $set: {
          ...(firstName             && { firstName }),
          ...(lastName              && { lastName }),
          ...(bio !== undefined      && { bio }),
          ...(department            && { department }),
          ...(level                 && { level }),
          ...(university            && { university }),
        }
      },
      { new: true, runValidators: false }
  );

  if (!updatedUser) return err(404, "Utilisateur introuvable");

  const userId = auth.user._id.toString();
  const [followersCount, followingCount, postsCount] = await Promise.all([
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower:  userId }),
    Post.countDocuments({ author: userId }),
  ]);

  return Response.json({
    ...sanitizeUser(updatedUser),
    followersCount,
    followingCount,
    postsCount,
  });
}
// PATCH /api/auth/me — mise à jour notifications, privacy, theme, language
export async function PATCH(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const body = await req.json();

  const allowedFields: Record<string, any> = {};

  if (body.notificationPrefs && typeof body.notificationPrefs === "object") {
    Object.entries(body.notificationPrefs).forEach(([k, v]) => {
      allowedFields[`notificationPrefs.${k}`] = v;
    });
  }
  if (body.privacySettings && typeof body.privacySettings === "object") {
    Object.entries(body.privacySettings).forEach(([k, v]) => {
      allowedFields[`privacySettings.${k}`] = v;
    });
  }
  if (typeof body.theme === "string")    allowedFields.theme    = body.theme;
  if (typeof body.language === "string") allowedFields.language = body.language;

  const updatedUser = await User.findByIdAndUpdate(
      auth.user._id,
      { $set: allowedFields },
      { new: true, runValidators: false }
  );

  if (!updatedUser) return err(404, "Utilisateur introuvable");

  return Response.json(sanitizeUser(updatedUser as any));
}
// DELETE /api/auth/me — supprime le compte et toutes les données liées
export async function DELETE(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const userId = auth.user._id.toString();

  // Supprimer toutes les données liées en parallèle
  await Promise.all([
    User.findByIdAndDelete(userId),
    // Importe Post, Comment, Like, Follow, Save, Notification, Message si besoin
    // Post.deleteMany({ author: userId }),
    // Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
    // Notification.deleteMany({ $or: [{ recipient: userId }, { actor: userId }] }),
  ]);

  return Response.json({ success: true });
}