import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, err } from "@/lib/auth.server";
import Notification from "@/models/Notification";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const n = await Notification.findOneAndUpdate(
    { _id: params.id, recipient: auth.user._id },
    { read: true },
    { new: true }
  );
  if (!n) return err(404, "Notification introuvable");
  return Response.json({ message: "Marquée comme lue" });
}
