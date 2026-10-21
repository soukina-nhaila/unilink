import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, sanitizeUser, err } from "@/lib/auth.server";

export async function POST(req: NextRequest) {
  await connectDB();
  const { firstName, lastName, email, password, department, level } = await req.json();

  if (!firstName || !lastName || !email || !password || !department || !level)
    return err(400, "Tous les champs sont requis");
  if (password.length < 8)
    return err(400, "Le mot de passe doit contenir au moins 8 caractères");

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return err(409, "Un compte avec cet email existe déjà");

  const user = await User.create({
    firstName, lastName,
    email: email.toLowerCase(),
    passwordHash: await hash(password, 10),
    department, level,
  });

  const token = await signToken(user._id.toString());
  return Response.json({ token, user: sanitizeUser(user) }, { status: 201 });
}
