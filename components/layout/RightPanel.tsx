"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Users, Bell, Search, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAuth } from "@/hooks/useAuth";
import { usersAPI, postsAPI } from "@/lib/api";
import { fetchNotifications } from "@/store/slices/notificationsSlice";
import { timeAgo, formatCount } from "@/lib/utils";
import { User } from "@/types";

const cardS: React.CSSProperties = {
  background:"#fff", borderRadius:14, border:"1px solid #E8E5FF",
  padding:16, boxShadow:"0 2px 12px rgba(108,79,246,0.08)", marginBottom:12
};
const titleS: React.CSSProperties = {
  fontSize:13, fontWeight:700, color:"#1A1333",
  display:"flex", alignItems:"center", gap:6, marginBottom:12
};

export function RightPanel() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(s => s.notifications.notifications).slice(0, 4);

  const [suggestions, setSuggestions]     = useState<(User & { isFollowing: boolean })[]>([]);
  const [trending, setTrending]           = useState<{ tag: string; count: number }[]>([]);
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
  const [searchQ, setSearchQ]             = useState("");

  // Stats fraîches chargées depuis l'API (pas depuis le store Redux figé)
  const [freshStats, setFreshStats] = useState<{
    followersCount: number;
    followingCount: number;
    postsCount: number;
    avatar: string;
    coverImage: string;
  } | null>(null);

  // Charger les stats fraîches du profil courant
  useEffect(() => {
    if (!user) return;
    usersAPI.getProfile("me")
        .then(r => setFreshStats({
          followersCount: r.data.followersCount,
          followingCount: r.data.followingCount,
          postsCount:     r.data.postsCount,
          avatar:         r.data.avatar ?? "",
          coverImage:     r.data.coverImage ?? "",
        }))
        .catch(() => {});
  }, [user?.id]);

  // Load suggestions + trending + notifications
  useEffect(() => {
    if (!user) return;
    usersAPI.getSuggestions().then(r => setSuggestions(r.data.users?.slice(0, 4) || [])).catch(() => {});
    postsAPI.getTrending().then(r => setTrending(r.data.topics?.slice(0, 5) || [])).catch(() => {});
    dispatch(fetchNotifications());
  }, [user, dispatch]);

  const toggleFollow = async (u: User & { isFollowing: boolean }) => {
    setFollowLoading(p => new Set(p).add(u.id));
    try {
      if (u.isFollowing) {
        await usersAPI.unfollow(u.id);
        setSuggestions(prev => prev.map(x => x.id === u.id ? { ...x, isFollowing: false } : x));
      } else {
        await usersAPI.follow(u.id);
        setSuggestions(prev => prev.map(x => x.id === u.id ? { ...x, isFollowing: true } : x));
      }
    } finally { setFollowLoading(p => { const n = new Set(p); n.delete(u.id); return n; }); }
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQ.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQ)}`;
    }
  };

  if (!user) return null;

  // Utiliser les stats fraîches si disponibles, sinon celles du store (pendant le chargement)
  const displayUser = freshStats
      ? { ...user, ...freshStats }
      : user;

  return (
      <aside>
        {/* Profile mini */}
        <div style={cardS}>
          <div style={{ textAlign:"center", paddingBottom:12 }}>
            <Avatar user={displayUser} size="lg" className="mx-auto" showRing />
            <p style={{ fontWeight:700, fontSize:15, color:"#1A1333", marginTop:10 }}>{user.firstName} {user.lastName}</p>
            <p style={{ fontSize:12, color:"#6C4FF6", fontWeight:600, marginTop:2 }}>{user.department} · {user.level}</p>
            {user.bio && <p style={{ fontSize:11, color:"#6B6885", marginTop:6, lineHeight:1.6 }}>{user.bio}</p>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
            {[
              { val: formatCount(displayUser.followersCount), lbl: "Abonnés" },
              { val: formatCount(displayUser.followingCount), lbl: "Suivis" },
              { val: String(displayUser.postsCount),          lbl: "Posts" },
            ].map(s => (
                <div key={s.lbl} style={{ background:"#F8F7FF", borderRadius:10, padding:"10px 6px", textAlign:"center" }}>
                  <p style={{ fontSize:15, fontWeight:700, color:"#6C4FF6", fontFamily:"monospace" }}>{s.val}</p>
                  <p style={{ fontSize:9, color:"#A09DBF", textTransform:"uppercase", letterSpacing:"0.05em", marginTop:2 }}>{s.lbl}</p>
                </div>
            ))}
          </div>
          <Link href="/profile/me"
                style={{ display:"block", textAlign:"center", padding:"8px 16px", borderRadius:10, border:"1px solid #C4B5FB", color:"#6C4FF6", fontSize:13, fontWeight:600, textDecoration:"none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#EDE9FE"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            Modifier le profil
          </Link>
        </div>

        {/* Search */}
        <div style={cardS}>
          <p style={titleS}><Search size={13} style={{ color:"#6C4FF6" }} /> Rechercher</p>
          <div style={{ position:"relative" }}>
            <Search size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#A09DBF" }} />
            <input type="text" placeholder="Nom, filière..." className="input"
                   value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={handleSearch}
                   style={{ paddingLeft:32, fontSize:12 }} />
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
            <div style={cardS}>
              <p style={titleS}><Users size={13} style={{ color:"#6C4FF6" }} /> Suggestions d'amis</p>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {suggestions.map(u => (
                    <div key={u.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar user={u} size="sm" />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:"#1A1333", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {u.firstName} {u.lastName}
                        </p>
                        <p style={{ fontSize:11, color:"#A09DBF" }}>{u.department} · {u.level}</p>
                      </div>
                      <button onClick={() => toggleFollow(u)} disabled={followLoading.has(u.id)}
                              style={{ fontSize:11, fontWeight:600, padding:"5px 10px", borderRadius:8, border:"none", cursor:"pointer",
                                background: u.isFollowing ? "#F1EFF8" : "#EDE9FE", color: u.isFollowing ? "#6B6885" : "#6C4FF6" }}
                              onMouseEnter={e => { if(!u.isFollowing){ (e.currentTarget as HTMLElement).style.background="#6C4FF6"; (e.currentTarget as HTMLElement).style.color="#fff"; }}}
                              onMouseLeave={e => { if(!u.isFollowing){ (e.currentTarget as HTMLElement).style.background="#EDE9FE"; (e.currentTarget as HTMLElement).style.color="#6C4FF6"; }}}>
                        {followLoading.has(u.id) ? <Loader2 size={10} className="animate-spin" /> :
                            u.isFollowing ? "Abonné ✓" : "Suivre"}
                      </button>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* Notifications récentes */}
        {notifications.length > 0 && (
            <div style={cardS}>
              <p style={titleS}><Bell size={13} style={{ color:"#6C4FF6" }} /> Notifications récentes</p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {notifications.map(n => (
                    <div key={n.id} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", marginTop:6, flexShrink:0,
                        background: n.type==="like" ? "#F472B6" : n.type==="follow" ? "#34D399" : "#6C4FF6" }} />
                      <div>
                        <p style={{ fontSize:12, color:"#6B6885", lineHeight:1.5 }}>
                          <span style={{ fontWeight:600, color:"#1A1333" }}>{n.actor.firstName}</span>{" "}
                          {n.type==="like"    && "a aimé votre publication"}
                          {n.type==="follow"  && "a commencé à vous suivre"}
                          {n.type==="comment" && "a commenté votre post"}
                          {n.type==="share"   && "a partagé votre post"}
                          {n.type==="mention" && "vous a mentionné"}
                        </p>
                        <p style={{ fontSize:10, color:"#A09DBF", marginTop:2 }}>{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* Trending topics */}
        {trending.length > 0 && (
            <div style={cardS}>
              <p style={titleS}><TrendingUp size={13} style={{ color:"#6C4FF6" }} /> Tendances du campus</p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {trending.map(t => (
                    <Link key={t.tag} href="/trending" style={{ textDecoration:"none" }}>
                      <p style={{ fontSize:13, fontWeight:600, color:"#1A1333" }} className="hover:text-primary transition-colors">#{t.tag}</p>
                      <p style={{ fontSize:11, color:"#A09DBF", fontFamily:"monospace" }}>{formatCount(t.count)} posts</p>
                    </Link>
                ))}
              </div>
            </div>
        )}
      </aside>
  );
}
