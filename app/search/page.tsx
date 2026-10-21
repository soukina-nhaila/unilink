"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Filter, Users, FileText, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/feed/PostCard";
import { Spinner } from "@/components/ui/Spinner";
import { usersAPI, postsAPI } from "@/lib/api";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { toggleLike, toggleSave } from "@/store/slices/feedSlice";
import { User, Post } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const DEPARTMENTS = ["Tous","Informatique","IA & Big Data","Génie Civil","Économie & Gestion","Réseaux & Télécoms","Mathématiques","Physique","Chimie"];
const LEVELS      = ["Tous","L1","L2","L3","M1","M2","Doctorat"];

export default function SearchPage() {
  const dispatch = useAppDispatch();
  const [query, setQuery]   = useState("");
  const [tab, setTab]       = useState<"users"|"posts">("users");
  const [dept, setDept]     = useState("Tous");
  const [level, setLevel]   = useState("Tous");
  const [users, setUsers]   = useState<(User & { isFollowing: boolean })[]>([]);
  const [posts, setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (q: string, d: string, l: string) => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        usersAPI.search(q, d !== "Tous" ? d : undefined, l !== "Tous" ? l : undefined),
        q.trim() ? postsAPI.getFeed("forYou", 1) : Promise.resolve({ data: { posts: [] } }),
      ]);
      setUsers(uRes.data.users || []);
      // Filter posts client-side for search (API doesn't have post search yet)
      const allPosts: Post[] = pRes.data.posts || [];
      const filtered = q.trim()
        ? allPosts.filter((p: Post) =>
            p.content.toLowerCase().includes(q.toLowerCase()) ||
            p.tags.some((t: string) => t.toLowerCase().includes(q.toLowerCase()))
          )
        : [];
      setPosts(filtered);
    } catch {
      setUsers([]); setPosts([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, dept, level), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, dept, level, doSearch]);

  // Initial load
  useEffect(() => { doSearch("", "Tous", "Tous"); }, []);

  const toggleFollow = async (u: User & { isFollowing: boolean }) => {
    setFollowLoading(p => new Set(p).add(u.id));
    try {
      if (u.isFollowing) { await usersAPI.unfollow(u.id); setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isFollowing: false } : x)); }
      else               { await usersAPI.follow(u.id);   setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isFollowing: true  } : x)); }
    } finally { setFollowLoading(p => { const n = new Set(p); n.delete(u.id); return n; }); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-text-1 mb-5">Recherche 🔍</h1>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3" />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Chercher un étudiant, une publication, un hashtag..."
          className="input pl-11 py-3 text-base" autoFocus />
      </div>

      <div className="flex gap-3 mb-5 overflow-x-auto pb-1 items-center">
        <Filter size={14} className="text-text-3 flex-shrink-0" />
        <select value={dept} onChange={e => setDept(e.target.value)} className="input text-xs py-1.5 w-auto min-w-[140px]">
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={level} onChange={e => setLevel(e.target.value)} className="input text-xs py-1.5 w-auto min-w-[100px]">
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
        {loading && <Loader2 size={16} className="animate-spin text-primary flex-shrink-0" />}
      </div>

      <div className="flex gap-1 bg-surface-3 p-1 rounded-[10px] mb-5 w-fit">
        {[
          { id: "users"  as const, label: "Étudiants",    icon: Users,    count: users.length },
          { id: "posts"  as const, label: "Publications",  icon: FileText, count: posts.length },
        ].map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-2 px-4 py-1.5 rounded-[8px] text-sm font-medium transition-all",
              tab === id ? "bg-white text-primary shadow-card" : "text-text-2")}>
            <Icon size={14} /> {label}
            <span className={cn("text-xs font-mono px-1.5 py-0.5 rounded-full",
              tab === id ? "bg-primary-50 text-primary" : "bg-surface-2 text-text-3")}>{count}</span>
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="card flex items-center gap-4 hover:border-primary-200 transition-all">
              <Link href={`/profile/${u.id}`}><Avatar user={u} size="md" /></Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${u.id}`} className="font-semibold text-text-1 hover:text-primary transition-colors">
                  {u.firstName} {u.lastName}
                </Link>
                <p className="text-sm text-primary font-medium mt-0.5">{u.department} · {u.level}</p>
                {u.bio && <p className="text-xs text-text-2 mt-1 truncate">{u.bio}</p>}
                <div className="flex gap-4 mt-2 text-xs text-text-3 font-mono">
                  <span>{u.followersCount} abonnés</span><span>{u.postsCount} posts</span>
                </div>
              </div>
              <button onClick={() => toggleFollow(u)} disabled={followLoading.has(u.id)}
                className={cn("text-sm font-semibold px-4 py-2 rounded-[10px] transition-all flex-shrink-0 flex items-center gap-2",
                  u.isFollowing ? "bg-surface-3 text-text-2" : "bg-primary-50 text-primary hover:bg-primary hover:text-white")}>
                {followLoading.has(u.id) ? <Loader2 size={13} className="animate-spin" /> :
                  u.isFollowing ? "Abonné ✓" : "Suivre"}
              </button>
            </div>
          ))}
          {users.length === 0 && !loading && (
            <div className="text-center py-16 text-text-3">
              <p className="text-3xl mb-2">🔍</p>
              <p className="font-medium">Aucun étudiant trouvé</p>
              <p className="text-sm mt-1">Essaie avec d'autres mots-clés ou filtres</p>
            </div>
          )}
        </div>
      )}

      {tab === "posts" && (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post}
              onLike={(id, liked) => dispatch(toggleLike({ postId: id, isLiked: liked }))}
              onSave={(id) => dispatch(toggleSave(id))} />
          ))}
          {posts.length === 0 && !loading && (
            <div className="text-center py-16 text-text-3">
              <p className="text-3xl mb-2">📝</p>
              <p className="font-medium">{query ? "Aucune publication trouvée" : "Saisissez un mot-clé pour chercher"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
