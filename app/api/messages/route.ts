import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth } from "@/lib/auth.server";
import Message from "@/models/Message";
import User from "@/models/User";

// POST — envoyer un message
export async function POST(req: NextRequest) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { receiverId, content } = await req.json();

  if (!content?.trim())
    return Response.json({ error: "Message vide" }, { status: 400 });

  const receiver = await User.findById(receiverId);
  if (!receiver)
    return Response.json({ error: "Destinataire introuvable" }, { status: 404 });

  const message = await Message.create({
    sender:   auth.user._id,
    receiver: receiverId,
    content:  content.trim(),
    read:     false,
  });

  return Response.json({
    id:         message._id.toString(),
    senderId:   message.sender.toString(),
    receiverId: message.receiver.toString(),
    content:    message.content,
    read:       message.read,
    createdAt:  message.createdAt.toISOString(),
  }, { status: 201 });
}