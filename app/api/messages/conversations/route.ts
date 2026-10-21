import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAuth, sanitizeUser } from "@/lib/auth.server";
import Message from "@/models/Message";
import User from "@/models/User";

export async function GET(req: NextRequest) {
    await connectDB();
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const myId = auth.user._id;

    // Trouver tous les messages où l'utilisateur est sender OU receiver
    const messages = await Message.find({
        $or: [{ sender: myId }, { receiver: myId }],
    })
        .sort({ createdAt: -1 })
        .lean() as any[];

    // Grouper par partenaire (partner = l'autre personne)
    const partnerMap = new Map<string, any>();

    for (const msg of messages) {
        const partnerId = msg.sender.toString() === myId.toString()
            ? msg.receiver.toString()
            : msg.sender.toString();

        if (!partnerMap.has(partnerId)) {
            partnerMap.set(partnerId, msg);
        }
    }

    // Charger les profils des partenaires
    const partnerIds = [...partnerMap.keys()];
    const partners   = await User.find({ _id: { $in: partnerIds } }).lean() as any[];
    const partnerById = Object.fromEntries(partners.map((u: any) => [u._id.toString(), u]));

    // Compter les messages non lus par partenaire
    const unreadCounts = await Promise.all(
        partnerIds.map(async (pid) => {
            const count = await Message.countDocuments({
                sender: pid, receiver: myId, read: false,
            });
            return { pid, count };
        })
    );
    const unreadMap = Object.fromEntries(unreadCounts.map(({ pid, count }) => [pid, count]));

    const conversations = partnerIds
        .filter((pid) => partnerById[pid])
        .map((pid) => {
            const lastMsg = partnerMap.get(pid);
            const partner = partnerById[pid];
            return {
                id:          `conv_${pid}`,
                participant: sanitizeUser(partner),
                lastMessage: {
                    id:         lastMsg._id.toString(),
                    senderId:   lastMsg.sender.toString(),
                    receiverId: lastMsg.receiver.toString(),
                    content:    lastMsg.content,
                    read:       lastMsg.read,
                    createdAt:  lastMsg.createdAt.toISOString(),
                },
                unreadCount: unreadMap[pid] ?? 0,
            };
        })
        .sort((a, b) =>
            new Date(b.lastMessage.createdAt).getTime() -
            new Date(a.lastMessage.createdAt).getTime()
        );

    return Response.json({ conversations });
}