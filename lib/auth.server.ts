import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { connectDB } from "./mongoose";
import User, { IUser } from "@/models/User";

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "unilink-dev-secret-change-in-production-32chars"
);

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.sub as string;
  } catch {
    return null;
  }
}

export function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("unilink_token")?.value ?? null;
}

export async function requireAuth(
    req: NextRequest
): Promise<{ user: IUser } | Response> {
  const token = extractToken(req);
  if (!token) return err(401, "Non autorisé — token manquant");

  const userId = await verifyToken(token);
  if (!userId) return err(401, "Token invalide ou expiré");

  await connectDB();
  const user = await User.findById(userId);
  if (!user) return err(401, "Utilisateur introuvable");

  return { user };
}

/**
 * Sérialise un utilisateur Mongoose.
 * Retourne null si l'utilisateur est null (auteur/acteur supprimé).
 */
export function sanitizeUser(user: IUser | null): any {
  if (!user || !user._id) return null;   // ← LE FIX PRINCIPAL
  return {
    id:             user._id.toString(),
    firstName:      user.firstName,
    lastName:       user.lastName,
    email:          user.email,
    avatar:         user.avatar || "",
    coverImage:     user.coverImage || "",
    department:     user.department,
    level:          user.level,
    bio:            user.bio,
    university:     user.university,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    postsCount:     user.postsCount,
    isOnline:       user.isOnline,
    createdAt:      user.createdAt.toISOString(),
    notificationPrefs: {
      newFollowers:   user.notificationPrefs?.newFollowers   ?? true,
      likes:          user.notificationPrefs?.likes          ?? true,
      comments:       user.notificationPrefs?.comments       ?? true,
      mentions:       user.notificationPrefs?.mentions       ?? true,
      directMessages: user.notificationPrefs?.directMessages ?? false,
      weeklyDigest:   user.notificationPrefs?.weeklyDigest   ?? false,
    },
    privacySettings: {
      privateAccount: user.privacySettings?.privateAccount  ?? false,
      showEmail:      user.privacySettings?.showEmail        ?? false,
      allowMessages:  user.privacySettings?.allowMessages    ?? true,
      appearInSearch: user.privacySettings?.appearInSearch   ?? true,
    },
    theme:    user.theme    || "violet",
    language: user.language || "fr",
  };
}

export function err(status: number, message: string): Response {
  return Response.json({ message }, { status });
}