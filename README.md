# UniLink — Réseau Social Universitaire (Fullstack)

> **Stack :** Next.js 14 · React 18 · TypeScript · Redux Toolkit · Tailwind CSS · **MongoDB + Mongoose** · JWT

---

## 🚀 Installation & Démarrage

### Prérequis
- Node.js v18+
- MongoDB Community Server ([télécharger](https://www.mongodb.com/try/download/community))
- MongoDB Compass ([télécharger](https://www.mongodb.com/try/download/compass)) — pour visualiser les données

### 1 — Installer les dépendances
```bash
npm install
```

### 2 — Démarrer MongoDB
```bash
# Windows (service)
net start MongoDB

# macOS / Linux
mongod --dbpath /data/db
```

### 3 — Configurer l'environnement
Le fichier `.env.local` est déjà prêt avec :
```
MONGODB_URI=mongodb://localhost:27017/unilink
JWT_SECRET=unilink-super-secret-jwt-key-change-in-prod-2025
```

### 4 — Peupler la base de données
```bash
npm run seed
```
✅ Crée 5 utilisateurs, 4 posts, commentaires, likes, follows, notifications, messages.

### 5 — Lancer l'application
```bash
npm run dev
# → http://localhost:3000
```

---

## 🔐 Comptes de démonstration
| Email | Mot de passe | Profil |
|-------|-------------|--------|
| k.alaoui@uni.ma | password123 | Karim — Informatique L3 |
| s.azizi@uni.ma | password123 | Salma — IA & Big Data M1 |
| m.fares@uni.ma | password123 | Mohammed — Génie Civil L2 |
| l.bensalem@uni.ma | password123 | Loubna — Économie M2 |
| y.benali@uni.ma | password123 | Youssef — Réseaux L3 |

---

## 🗄️ MongoDB Compass
Connectez-vous à `mongodb://localhost:27017` et explorez la base **unilink** :

| Collection | Contenu |
|------------|---------|
| `users` | Profils étudiants (email unique, passwordHash bcrypt) |
| `posts` | Publications avec tags, compteurs |
| `comments` | Commentaires liés aux posts |
| `likes` | Index unique (user + post) |
| `saves` | Posts enregistrés par user |
| `follows` | Relations follower ↔ following |
| `notifications` | Alertes (like, comment, follow, share) |
| `messages` | Messagerie directe |

---

## 📁 Structure du projet

```
unilink/
├── app/
│   ├── api/                    ← Backend (26 routes REST)
│   │   ├── auth/               ← register · login · logout · me
│   │   ├── posts/              ← feed · trending · user/:id · CRUD · like · save · share · comments
│   │   ├── users/              ← search · suggestions · :id · follow · followers · following
│   │   ├── notifications/      ← liste · mark-read · read-all
│   │   └── messages/           ← conversations · :userId · send
│   ├── auth/login              ← Page connexion
│   ├── auth/register           ← Page inscription
│   ├── feed/                   ← Fil d'actualité (Redux)
│   ├── profile/[id]/           ← Profil (posts / aimés / enregistrés)
│   ├── search/                 ← Recherche étudiants + posts
│   ├── notifications/          ← Notifications temps réel
│   ├── messages/               ← Messagerie directe
│   ├── friends/                ← Amis / suggestions / followers / following
│   ├── trending/               ← Tendances + hashtags MongoDB
│   └── settings/               ← Paramètres profil (sauvegarde DB)
│
├── models/                     ← Schémas Mongoose
│   ├── User.ts · Post.ts · Comment.ts · Like.ts
│   ├── Save.ts · Follow.ts · Notification.ts · Message.ts
│
├── lib/
│   ├── mongoose.ts             ← Connexion singleton MongoDB
│   ├── auth.server.ts          ← JWT (jose) + requireAuth middleware
│   ├── api.ts                  ← Client axios frontend → /api
│   └── utils.ts                ← cn · timeAgo · formatCount · avatarColor
│
├── store/slices/               ← Redux Toolkit (authSlice · feedSlice · notificationsSlice)
├── hooks/                      ← useAuth · useFeed · useAppDispatch · useAppSelector
├── components/
│   ├── feed/PostCard.tsx       ← Commentaires réels + delete + like/save optimiste
│   ├── feed/CreatePost.tsx     ← Publication → MongoDB
│   ├── layout/Sidebar.tsx      ← Badge notifications live
│   └── layout/RightPanel.tsx   ← Suggestions + trending depuis MongoDB
├── scripts/seed.ts             ← Peuplement MongoDB
├── types/index.ts
├── .env.local                  ← MONGODB_URI + JWT_SECRET
└── next.config.js
```

---

## ✅ Fonctionnalités 100% connectées à MongoDB

| Fonctionnalité | Route API | Description |
|---|---|---|
| Inscription | POST /api/auth/register | Hash bcrypt, JWT retourné |
| Connexion | POST /api/auth/login | Vérifie hash, JWT 7j |
| Modifier profil | PUT /api/auth/me | Sauvegarde en DB |
| Fil d'actualité | GET /api/posts/feed | Pagination, tabs (forYou/following/popular) |
| Créer un post | POST /api/posts | Auteur depuis JWT |
| Liker / Unliker | POST/DELETE /api/posts/:id/like | Notification automatique |
| Enregistrer | POST/DELETE /api/posts/:id/save | |
| Partager | POST /api/posts/:id/share | Notification automatique |
| Supprimer post | DELETE /api/posts/:id | Vérifie ownership |
| Commenter | POST /api/posts/:id/comments | Notification automatique |
| Supprimer commentaire | DELETE /api/posts/:id/comments/:cid | |
| Profil étudiant | GET /api/users/:id | Posts / aimés / enregistrés |
| Suivre / Unfollower | POST/DELETE /api/users/:id/follow | Compteurs mis à jour |
| Recherche | GET /api/users/search?q= | Filtre dept + niveau |
| Suggestions amis | GET /api/users/suggestions | Exclut déjà suivis |
| Notifications | GET /api/notifications | Marquage lu individuel + tout |
| Conversations | GET /api/messages/conversations | Dernier message + unread count |
| Messages | GET /api/messages/:userId | Marque lu à l'ouverture |
| Envoyer message | POST /api/messages | |
| Tendances | GET /api/posts/trending | Agrégation MongoDB tags |
