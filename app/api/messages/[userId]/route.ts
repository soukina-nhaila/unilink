import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth } from "@/lib/auth.server";
import Message from "@/models/Message";
import User from "@/models/User";

// GET — charger les messages d'une conversation
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  await connectDB();
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const myId      = auth.user._id;
  const partnerId = params.userId;

  // Vérifier que le partenaire existe
  const partner = await User.findById(partnerId);
  if (!partner) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });

  // Charger tous les messages entre les deux utilisateurs
  const messages = await Message.find({
    $or: [
      { sender: myId,      receiver: partnerId },
      { sender: partnerId, receiver: myId },
    ],
  })
      .sort({ createdAt: 1 })
      .lean() as any[];

  // Marquer les messages reçus comme lus
  await Message.updateMany(
      { sender: partnerId, receiver: myId, read: false },
      { read: true }
  );

  return Response.json({
    messages: messages.map((m: any) => ({
      id:         m._id.toString(),
      senderId:   m.sender.toString(),
      receiverId: m.receiver.toString(),
      content:    m.content,
      read:       m.read,
      createdAt:  m.createdAt.toISOString(),
    })),
  });
}