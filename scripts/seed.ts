/**
 * scripts/seed.ts
 * Peuple la base MongoDB avec des données de démonstration.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/seed.ts
 *   ou: npx tsx scripts/seed.ts
 */

import mongoose from "mongoose";
import { hash } from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/unilink";

// Import models (mini inline pour éviter les imports circulaires)
async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connecté à MongoDB:", MONGODB_URI);

  const db = mongoose.connection.db!;

  // Drop collections if exist
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);
  for (const col of ["users","posts","comments","likes","saves","follows","notifications","messages"]) {
    if (names.includes(col)) await db.dropCollection(col);
  }
  console.log("🗑️  Collections supprimées");

  const pwd = await hash("password123", 10);
  const now = new Date();
  const d = (mins: number) => new Date(now.getTime() - mins * 60000);

  // ── Users ──────────────────────────────────────────────────────────────────
  const u1 = new mongoose.Types.ObjectId();
  const u2 = new mongoose.Types.ObjectId();
  const u3 = new mongoose.Types.ObjectId();
  const u4 = new mongoose.Types.ObjectId();
  const u5 = new mongoose.Types.ObjectId();

  await db.collection("users").insertMany([
    { _id:u1, firstName:"Karim",    lastName:"Alaoui",    email:"k.alaoui@uni.ma",   passwordHash:pwd, avatar:"",  department:"Informatique",        level:"L3", bio:"Passionné de dev web, IA et open source 🚀 | Next.js · Python · ML",      university:"Université Mohammed V", followersCount:847,  followingCount:312, postsCount:2, isOnline:true,  createdAt:now, updatedAt:now },
    { _id:u2, firstName:"Salma",    lastName:"Azizi",     email:"s.azizi@uni.ma",    passwordHash:pwd, avatar:"https://api.dicebear.com/8.x/personas/svg?seed=Salma",  department:"IA & Big Data",        level:"M1", bio:"Data scientist en devenir | XGBoost · TensorFlow · Kaggle",               university:"Université Mohammed V", followersCount:1243, followingCount:456, postsCount:2, isOnline:true,  createdAt:now, updatedAt:now },
    { _id:u3, firstName:"Mohammed", lastName:"Fares",     email:"m.fares@uni.ma",    passwordHash:pwd, avatar:"",  department:"Génie Civil",          level:"L2", bio:"Ingénieur en devenir | Robotique · Électronique",                         university:"Université Mohammed V", followersCount:523,  followingCount:198, postsCount:1, isOnline:false, createdAt:now, updatedAt:now },
    { _id:u4, firstName:"Loubna",   lastName:"Bensalem",  email:"l.bensalem@uni.ma", passwordHash:pwd, avatar:"",  department:"Économie & Gestion",   level:"M2", bio:"Théorie des jeux · Finance comportementale · Econométrie",               university:"Université Mohammed V", followersCount:2100, followingCount:312, postsCount:1, isOnline:false, createdAt:now, updatedAt:now },
    { _id:u5, firstName:"Youssef",  lastName:"Ben Ali",   email:"y.benali@uni.ma",   passwordHash:pwd, avatar:"",  department:"Réseaux & Télécoms",   level:"L3", bio:"NLP · BERT · Open Source contributor",                                   university:"Université Mohammed V", followersCount:412,  followingCount:203, postsCount:2, isOnline:true,  createdAt:now, updatedAt:now },
  ]);
  console.log("👤 5 utilisateurs créés");

  // ── Posts ──────────────────────────────────────────────────────────────────
  const p1 = new mongoose.Types.ObjectId();
  const p2 = new mongoose.Types.ObjectId();
  const p3 = new mongoose.Types.ObjectId();
  const p4 = new mongoose.Types.ObjectId();

  await db.collection("posts").insertMany([
    { _id:p1, author:u2, content:"Je viens de terminer mon projet de machine learning sur la prédiction des résultats académiques 🎯 Le modèle atteint 94% de précision avec XGBoost ! Quelqu'un a des expériences avec des datasets similaires ?", images:[], tags:["MachineLearning","DataScience","IAUniv"], likesCount:142, commentsCount:2, sharesCount:17, isTrending:true,  createdAt:d(12),    updatedAt:d(12) },
    { _id:p2, author:u3, content:"📢 Rappel : la compétition inter-filières de robotique aura lieu le 15 juin dans l'amphi B ! Inscription gratuite, les équipes de 2 à 4 membres sont les bienvenues. On cherche encore des membres 👋",         images:[], tags:["Robotique","Événement","Université"],  likesCount:87,  commentsCount:3, sharesCount:34, isTrending:false, createdAt:d(60),    updatedAt:d(60) },
    { _id:p3, author:u4, content:"Partage de mes notes de cours sur la théorie des jeux et l'économie comportementale 📚 Format PDF bien structuré, avec des exercices corrigés. Utile pour les L3 et M1 en éco !",                              images:[], tags:["CoursPartage","Économie","Entraide"],  likesCount:213, commentsCount:5, sharesCount:52, isTrending:false, createdAt:d(180),   updatedAt:d(180) },
    { _id:p4, author:u5, content:"🔥 Tip Next.js 14 : les Server Actions permettent de soumettre des formulaires sans JavaScript côté client ! Votre formulaire fonctionne même avec JS désactivé. Révolutionnaire pour l'accessibilité.",         images:[], tags:["NextJS","React","WebDev"],             likesCount:334, commentsCount:8, sharesCount:88, isTrending:true,  createdAt:d(300),   updatedAt:d(300) },
  ]);
  console.log("📝 4 publications créées");

  // ── Comments ───────────────────────────────────────────────────────────────
  await db.collection("comments").insertMany([
    { _id:new mongoose.Types.ObjectId(), post:p1, author:u5, content:"Impressionnant ! J'ai travaillé avec BERT pour un dataset similaire 🚀",    likesCount:12, createdAt:d(8),   updatedAt:d(8) },
    { _id:new mongoose.Types.ObjectId(), post:p1, author:u1, content:"Super travail ! Tu as utilisé quelle taille de dataset ?",                  likesCount:5,  createdAt:d(6),   updatedAt:d(6) },
    { _id:new mongoose.Types.ObjectId(), post:p2, author:u1, content:"Je suis intéressé ! Comment on s'inscrit ?",                                likesCount:3,  createdAt:d(50),  updatedAt:d(50) },
    { _id:new mongoose.Types.ObjectId(), post:p3, author:u2, content:"Merci beaucoup pour ce partage ! Très utile pour nos révisions 🙏",         likesCount:8,  createdAt:d(120), updatedAt:d(120) },
    { _id:new mongoose.Types.ObjectId(), post:p4, author:u1, content:"Les Server Actions sont vraiment révolutionnaires, merci pour ce tip !",    likesCount:15, createdAt:d(240), updatedAt:d(240) },
  ]);
  console.log("💬 5 commentaires créés");

  // ── Likes ──────────────────────────────────────────────────────────────────
  await db.collection("likes").insertMany([
    { user:u1, post:p2, createdAt:now },
    { user:u1, post:p4, createdAt:now },
    { user:u2, post:p4, createdAt:now },
    { user:u3, post:p1, createdAt:now },
  ]);
  console.log("❤️  4 likes créés");

  // ── Saves ──────────────────────────────────────────────────────────────────
  await db.collection("saves").insertMany([
    { user:u1, post:p3, createdAt:now },
  ]);
  console.log("🔖 1 save créé");

  // ── Follows ────────────────────────────────────────────────────────────────
  await db.collection("follows").insertMany([
    { follower:u1, following:u2, createdAt:now },
    { follower:u1, following:u3, createdAt:now },
    { follower:u2, following:u1, createdAt:now },
    { follower:u3, following:u1, createdAt:now },
    { follower:u4, following:u1, createdAt:now },
    { follower:u5, following:u2, createdAt:now },
  ]);
  console.log("👥 6 follows créés");

  // ── Notifications ──────────────────────────────────────────────────────────
  await db.collection("notifications").insertMany([
    { recipient:u1, actor:u2, type:"like",    post:p4, read:false, createdAt:d(5) },
    { recipient:u1, actor:u3, type:"follow",           read:false, createdAt:d(22) },
    { recipient:u1, actor:u5, type:"comment", post:p1, read:false, createdAt:d(60) },
    { recipient:u1, actor:u4, type:"like",    post:p2, read:true,  createdAt:d(120) },
  ]);
  console.log("🔔 4 notifications créées");

  // ── Messages ───────────────────────────────────────────────────────────────
  await db.collection("messages").insertMany([
    { sender:u1, receiver:u2, content:"Salut ! Comment tu vas ?",                                   read:true,  createdAt:d(120) },
    { sender:u2, receiver:u1, content:"Très bien ! J'ai vu ton projet, vraiment impressionnant 🔥", read:true,  createdAt:d(116) },
    { sender:u1, receiver:u2, content:"Merci ! T'aurais un moment pour qu'on révise ensemble ?",    read:true,  createdAt:d(60) },
    { sender:u2, receiver:u1, content:"Super ! On se retrouve à la biblio demain ?",                read:false, createdAt:d(58) },
    { sender:u3, receiver:u1, content:"Tu participes à la compétition de robotique ?",              read:false, createdAt:d(1440) },
  ]);
  console.log("✉️  5 messages créés");

  console.log("\n🎉 Base de données peuplée avec succès !");
  console.log("📧 Comptes de test (mot de passe: password123):");
  console.log("   k.alaoui@uni.ma  — Karim Alaoui (Informatique L3)");
  console.log("   s.azizi@uni.ma   — Salma Azizi (IA & Big Data M1)");
  console.log("   l.bensalem@uni.ma — Loubna Bensalem (Économie M2)");

  await mongoose.disconnect();
}

run().catch((err) => { console.error("❌ Erreur:", err); process.exit(1); });
