/**
 * lib/mongoose.ts
 * Connexion MongoDB singleton — compatible Next.js hot-reload.
 * En développement, la connexion est réutilisée entre les rechargements.
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/unilink";

if (!MONGODB_URI) {
  throw new Error("Veuillez définir MONGODB_URI dans .env.local");
}

// Cache global pour éviter de recréer la connexion à chaque hot-reload
const globalWithMongoose = global as typeof globalThis & {
  _mongooseCache?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!globalWithMongoose._mongooseCache) {
  globalWithMongoose._mongooseCache = { conn: null, promise: null };
}

const cached = globalWithMongoose._mongooseCache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
