import { NextRequest } from "next/server";
import { compare } from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, sanitizeUser, err } from "@/lib/auth.server";

export async function POST(req: NextRequest) {
  await connectDB();
  const { email, password } = await req.json();
  if (!email || !password) return err(400, "Email et mot de passe requis");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await compare(password, user.passwordHash)))
    return err(401, "Email ou mot de passe incorrect");

  user.isOnline = true;
  await user.save();

  const token = await signToken(user._id.toString());
  return Response.json({ token, user: sanitizeUser(user) });
}
