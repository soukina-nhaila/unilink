import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, err } from "@/lib/auth.server";
import Post from "@/models/Post";
import Save from "@/models/Save";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!await Post.exists({ _id: params.id })) return err(404, "Publication introuvable");
  if (await Save.exists({ user: auth.user._id, post: params.id })) return err(409, "Déjà enregistré");
  await Save.create({ user: auth.user._id, post: params.id });
  return Response.json({ saved: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const save = await Save.findOneAndDelete({ user: auth.user._id, post: params.id });
  if (!save) return err(404, "Enregistrement introuvable");
  return Response.json({ saved: false });
}
