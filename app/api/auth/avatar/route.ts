import { NextRequest } from "next/server";
import { requireAuth, sanitizeUser } from "@/lib/auth.server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    await connectDB();
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) return Response.json({ error: "Fichier manquant" }, { status: 400 });
    if (file.size > 2 * 1024 * 1024) {
        return Response.json({ error: "Image trop grande (max 2MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const field = type === "cover" ? "coverImage" : "avatar";

    // $set force l'écriture même si le champ n'existait pas dans le document
    // new: true retourne le document MIS À JOUR depuis la DB
    const updatedUser = await User.findByIdAndUpdate(
        auth.user._id,
        { $set: { [field]: dataUrl } },
        { new: true, runValidators: false }
    );

    if (!updatedUser) {
        return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return Response.json({ url: dataUrl, user: sanitizeUser(updatedUser) });
}
