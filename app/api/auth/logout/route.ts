import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth.server";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  auth.user.isOnline = false;
  await auth.user.save();
  return Response.json({ message: "Déconnecté avec succès" });
}
