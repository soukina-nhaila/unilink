import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser } from "@/lib/auth.server";
import Notification from "@/models/Notification";

export async function GET(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const notifs = await Notification.find({ recipient: auth.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("actor")
    .lean() as any[];

// APRÈS — filtrer les notifications dont l'acteur est supprimé
  const notifications = notifs
      .map((n) => {
        const actor = sanitizeUser(n.actor as any);
        if (!actor) return null;  // acteur supprimé → ignorer
        return {
          id:        n._id.toString(),
          type:      n.type,
          actor,
          postId:    n.post?.toString(),
          read:      n.read,
          createdAt: n.createdAt,
        };
      })
      .filter(Boolean);

  const unreadCount = notifications.filter((n) => !n.read).length;
  return Response.json({ notifications, unreadCount });
}
