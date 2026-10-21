"use client";
import { useEffect, useState, useCallback } from "react";
import { Camera, MapPin, Calendar, UserCheck, UserPlus, MessageCircle, Grid3X3, Heart, Bookmark, Loader2, ImagePlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/feed/PostCard";
import { Spinner } from "@/components/ui/Spinner";
import { FollowDialog } from "@/components/profile/FollowDialog";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { toggleLike, toggleSave } from "@/store/slices/feedSlice";
import { fetchCurrentUser } from "@/store/slices/authSlice";
import { usersAPI, postsAPI } from "@/lib/api";
import { formatCount, formatDate, cn } from "@/lib/utils";
import { User, Post } from "@/types";
import Link from "next/link";

type ProfileTab = "posts" | "liked" | "saved";
type DialogType = "followers" | "following" | null;

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { user: currentUser } = useAuth();
  const dispatch = useAppDispatch();
  const isMe = params.id === "me" || params.id === currentUser?.id;

  // On ne pré-remplit JAMAIS depuis currentUser pour éviter les données figées
  // On charge toujours depuis l'API pour avoir les vraies valeurs de la DB
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Dialog abonnés/abonnements
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dialogUsers, setDialogUsers] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);

  // ─── Charger le profil depuis l'API (toujours, même pour "me") ───────────
  useEffect(() => {
    // Attendre que currentUser soit chargé avant de déterminer l'ID réel
    if (!currentUser && isMe) return;

    setLoadingProfile(true);
    const uid = isMe ? "me" : params.id;

    usersAPI.getProfile(uid)
        .then(r => {
          setProfile(r.data);
          setFollowing(r.data.isFollowing ?? false);
        })
        .catch(() => setProfile(null))
        .finally(() => setLoadingProfile(false));
  }, [params.id, isMe, currentUser?.id]);

  // ─── Charger les posts selon l'onglet ────────────────────────────────────
  const loadPosts = useCallback(async (tab: ProfileTab) => {
    const uid = isMe ? "me" : params.id;
    setLoadingPosts(true);
    try {
      const res = await postsAPI.getByUser(uid, tab);
      setPosts(res.data.posts ?? []);
    } catch { setPosts([]); }
    finally { setLoadingPosts(false); }
  }, [params.id, isMe]);

  useEffect(() => { if (profile) loadPosts(activeTab); }, [activeTab, profile?.id, loadPosts]);

  // ─── Suivre / Se désabonner ───────────────────────────────────────────────
  // ─── Suivre / Se désabonner ───────────────────────────────────────────────
  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (following) {
        const res = await usersAPI.unfollow(profile.id);
        setFollowing(false);
        // Utiliser les compteurs retournés par l'API (valeurs réelles de la DB)
        setProfile(p => p ? {
          ...p,
          followersCount: res.data?.followersCount ?? Math.max(0, p.followersCount - 1),
        } : p);
      } else {
        const res = await usersAPI.follow(profile.id);
        setFollowing(true);
        // Utiliser les compteurs retournés par l'API (valeurs réelles de la DB)
        setProfile(p => p ? {
          ...p,
          followersCount: res.data?.followersCount ?? p.followersCount + 1,
        } : p);
      }
    } finally { setFollowLoading(false); }
  };

  // ─── Upload avatar ou cover ───────────────────────────────────────────────
  const handleImageUpload = async (file: File, type: "avatar" | "cover") => {
    if (file.size > 2 * 1024 * 1024) {
      alert("Image trop grande. Maximum 2MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const token = typeof window !== "undefined" ? localStorage.getItem("unilink_token") : null;
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        // 1. Mettre à jour l'affichage local immédiatement
        const field = type === "cover" ? "coverImage" : "avatar";
        setProfile(p => p ? { ...p, [field]: data.url } : p);
        // 2. Recharger le store Redux pour que RightPanel et Avatar soient à jour partout
        dispatch(fetchCurrentUser());
      } else {
        alert(data.error || "Erreur lors de l'upload.");
      }
    } catch (e) {
      alert("Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  // ─── Ouvrir le dialog abonnés/abonnements ────────────────────────────────
  const openDialog = async (type: "followers" | "following") => {
    setDialogType(type);
    setDialogLoading(true);
    setDialogUsers([]);
    try {
      const uid = isMe ? (currentUser?.id ?? params.id) : params.id;
      const res = type === "followers"
          ? await usersAPI.getFollowers(uid)
          : await usersAPI.getFollowing(uid);
      setDialogUsers(res.data.users ?? []);
    } catch { setDialogUsers([]); }
    finally { setDialogLoading(false); }
  };

  const handleUserRemoved = (userId: string) => {
    setDialogUsers(prev => prev.filter(u => u.id !== userId));
    setProfile(p => {
      if (!p) return p;
      if (dialogType === "followers") return { ...p, followersCount: Math.max(0, p.followersCount - 1) };
      if (dialogType === "following") return { ...p, followingCount: Math.max(0, p.followingCount - 1) };
      return p;
    });
  };

  const handleLike = (id: string, liked: boolean) => dispatch(toggleLike({ postId: id, isLiked: liked }));
  const handleSave = (id: string) => dispatch(toggleSave(id));

  // ─── Rendu ────────────────────────────────────────────────────────────────
  if (loadingProfile) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!profile) return (
      <div className="text-center py-20 text-text-3">
        <p className="text-4xl mb-3">👤</p>
        <p className="font-medium">Profil introuvable</p>
      </div>
  );

  return (
      <div>
        {/* ===== COVER ===== */}
        <div
            className="relative h-40 rounded-2xl mb-14 overflow-hidden"
            style={{
              background: profile.coverImage
                  ? undefined
                  : "linear-gradient(135deg,#EDE9FE 0%,#C4B5FB 50%,#FCE7F3 100%)",
            }}
        >
          {/* Image de couverture via <img> pour éviter les blocages CSP sur les data: URLs */}
          {profile.coverImage && (
              <img
                  src={profile.coverImage}
                  alt="cover"
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover", objectPosition: "center",
                    pointerEvents: "none",
                  }}
              />
          )}
          {/* Bouton modifier la cover */}
          {isMe && (
              <label
                  style={{
                    position: "absolute", top: 12, right: 12,
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 20,
                    background: "rgba(0,0,0,0.50)", color: "#fff",
                    fontSize: 12, fontWeight: 600, cursor: uploading ? "wait" : "pointer",
                    backdropFilter: "blur(4px)", userSelect: "none",
                  }}
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                Modifier la couverture
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "cover")}
                />
              </label>
          )}

          {/* Avatar positionné en bas à gauche */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              {/* L'avatar utilise profile.avatar (chargé depuis l'API, donc toujours à jour) */}
              <Avatar user={profile} size="xl" showRing className="border-4 border-white" />
              {profile.isOnline && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-accent-green border-2 border-white rounded-full" />
              )}
              {/* Bouton modifier la photo de profil */}
              {isMe && (
                  <label
                      className="absolute bottom-0 right-0 w-8 h-8 text-white rounded-full flex items-center justify-center border-2 border-white"
                      style={{
                        background: uploading ? "#9CA3AF" : "#6C4FF6",
                        cursor: uploading ? "wait" : "pointer",
                      }}
                      title="Changer la photo de profil"
                  >
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploading}
                        onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "avatar")}
                    />
                  </label>
              )}
            </div>
          </div>
        </div>

        {/* ===== NOM + BOUTONS ===== */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-1">{profile.firstName} {profile.lastName}</h1>
            <p className="text-primary font-semibold text-sm mt-0.5">{profile.department} · {profile.level}</p>
            {profile.bio && <p className="text-sm text-text-2 mt-2 leading-relaxed max-w-lg">{profile.bio}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-text-3">
              <span className="flex items-center gap-1"><MapPin size={12} /> {profile.university}</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> Depuis {formatDate(profile.createdAt)}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            {isMe ? (
                <Link href="/settings" className="btn-ghost text-sm py-2">Modifier le profil</Link>
            ) : (
                <>
                  <Link
                      href={`/messages?with=${profile.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-surface-2 text-text-2 text-sm font-semibold hover:bg-surface-3 transition-all"
                  >
                    <MessageCircle size={15} /> Message
                  </Link>
                  <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all",
                          following ? "bg-surface-2 text-text-2 hover:bg-red-50 hover:text-red-500" : "btn-primary"
                      )}
                  >
                    {followLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : following ? (
                        <><UserCheck size={15} /> Abonné</>
                    ) : (
                        <><UserPlus size={15} /> Suivre</>
                    )}
                  </button>
                </>
            )}
          </div>
        </div>

        {/* ===== STATS ── chargées depuis l'API, pas depuis le store figé ===== */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Publications : simple div, pas cliquable */}
          <div className="card text-center py-4">
            <p className="text-xl font-bold text-primary font-mono">{formatCount(profile.postsCount)}</p>
            <p className="text-xs text-text-3 uppercase tracking-wide mt-0.5">Publications</p>
          </div>

          {/* Abonnés : cliquable → ouvre le dialog */}
          <button
              className="card text-center py-4 hover:border-primary-200 hover:bg-primary-50 transition-colors cursor-pointer w-full"
              onClick={() => openDialog("followers")}
          >
            <p className="text-xl font-bold text-primary font-mono">{formatCount(profile.followersCount)}</p>
            <p className="text-xs text-text-3 uppercase tracking-wide mt-0.5">Abonnés</p>
          </button>

          {/* Abonnements : cliquable → ouvre le dialog */}
          <button
              className="card text-center py-4 hover:border-primary-200 hover:bg-primary-50 transition-colors cursor-pointer w-full"
              onClick={() => openDialog("following")}
          >
            <p className="text-xl font-bold text-primary font-mono">{formatCount(profile.followingCount)}</p>
            <p className="text-xs text-text-3 uppercase tracking-wide mt-0.5">Abonnements</p>
          </button>
        </div>

        {/* ===== ONGLETS ===== */}
        <div className="flex border-b border-border mb-5">
          {([
            { id: "posts" as ProfileTab, label: "Publications", icon: Grid3X3 },
            { id: "liked" as ProfileTab, label: "Aimés",        icon: Heart },
            { id: "saved" as ProfileTab, label: "Enregistrés",  icon: Bookmark },
          ]).map(({ id, label, icon: Icon }) => (
              <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                      "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px",
                      activeTab === id ? "border-primary text-primary" : "border-transparent text-text-3 hover:text-text-2"
                  )}
              >
                <Icon size={15} /> {label}
              </button>
          ))}
        </div>

        {/* ===== POSTS ===== */}
        {loadingPosts ? (
            <div className="flex justify-center py-12"><Spinner /></div>
        ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map(post => (
                  <PostCard key={post.id} post={post} onLike={handleLike} onSave={handleSave} />
              ))}
            </div>
        ) : (
            <div className="text-center py-16 text-text-3">
              <p className="text-3xl mb-2">
                {activeTab === "posts" ? "✍️" : activeTab === "liked" ? "❤️" : "🔖"}
              </p>
              <p className="font-medium">
                {activeTab === "posts"
                    ? (isMe ? "Tu n'as pas encore publié" : "Aucune publication")
                    : activeTab === "liked" ? "Aucun post aimé" : "Aucun post enregistré"}
              </p>
            </div>
        )}

        {/* ===== DIALOG ABONNÉS / ABONNEMENTS ===== */}
        {dialogType && (
            <FollowDialog
                type={dialogType}
                users={dialogUsers}
                loading={dialogLoading}
                isMyProfile={isMe}
                onClose={() => setDialogType(null)}
                onUserRemoved={handleUserRemoved}
            />
        )}
      </div>
  );
}
