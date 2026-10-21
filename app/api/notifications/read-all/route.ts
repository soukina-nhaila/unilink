import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth } from "@/lib/auth.server";
import Notification from "@/models/Notification";

export async function PUT(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  await Notification.updateMany({ recipient: auth.user._id, read: false }, { read: true });
  return Response.json({ message: "Toutes les notifications marquées comme lues" });
}
