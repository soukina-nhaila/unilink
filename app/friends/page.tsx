"use client";
import { useEffect, useState, useCallback } from "react";
import { UserCheck, UserPlus, Users, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { usersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatCount, cn } from "@/lib/utils";
import { User } from "@/types";
import Link from "next/link";

type FriendsTab = "suggestions" | "followers" | "following";

export default function FriendsPage() {
  const { user: me } = useAuth();
  const [tab, setTab] = useState<FriendsTab>("suggestions");
  const [users, setUsers] = useState<(User & { isFollowing: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState({ suggestions: 0, followers: 0, following: 0 });

  const load = useCallback(async (t: FriendsTab) => {
    setLoading(true);
    try {
      let res;
      if (t === "suggestions") res = await usersAPI.getSuggestions();
      else if (t === "followers") res = await usersAPI.getFollowers("me");
      else res = await usersAPI.getFollowing("me");
      const list = res.data.users || [];
      setUsers(list);
      setCounts(c => ({ ...c, [t]: list.length }));
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  const toggleFollow = async (u: User & { isFollowing: boolean }) => {
    setFollowLoading(p => new Set(p).add(u.id));
    try {
      if (u.isFollowing) {
        await usersAPI.unfollow(u.id);
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isFollowing: false } : x));
      } else {
        await usersAPI.follow(u.id);
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isFollowing: true } : x));
      }
    } finally {
      setFollowLoading(p => { const n = new Set(p); n.delete(u.id); return n; });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-text-1 mb-5">Amis & Abonnements 👥</h1>

      <div className="flex gap-1 bg-surface-3 p-1 rounded-[10px] mb-5 w-fit">
        {([
          { id: "suggestions" as FriendsTab, label: "Suggestions" },
          { id: "followers"   as FriendsTab, label: "Abonnés" },
          { id: "following"   as FriendsTab, label: "Abonnements" },
        ]).map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("px-4 py-1.5 rounded-[8px] text-sm font-medium transition-all flex items-center gap-2",
              tab === id ? "bg-white text-primary shadow-card" : "text-text-2"
            )}>
            {label}
            <span className={cn("text-xs font-mono px-1.5 py-0.5 rounded-full",
              tab === id ? "bg-primary-50 text-primary" : "bg-surface-2 text-text-3")}>
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-text-3">
          <p className="text-4xl mb-3"><Users size={40} className="mx-auto opacity-30" /></p>
          <p className="font-medium">
            {tab === "suggestions" ? "Aucune suggestion pour le moment" :
             tab === "followers" ? "Aucun abonné" : "Tu ne suis personne"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {users.map(u => (
            <div key={u.id} className="card flex flex-col items-center text-center hover:border-primary-200 transition-all">
              <div className="relative mb-3">
                <Avatar user={u} size="lg" />
                {u.isOnline && <div className="absolute bottom-1 right-1 w-3 h-3 bg-accent-green border-2 border-white rounded-full" />}
              </div>
              <Link href={`/profile/${u.id}`} className="font-bold text-text-1 hover:text-primary transition-colors">
                {u.firstName} {u.lastName}
              </Link>
              <p className="text-xs text-primary font-semibold mt-0.5">{u.department} · {u.level}</p>
              {u.bio && <p className="text-xs text-text-3 mt-2 line-clamp-2 leading-relaxed">{u.bio}</p>}
              <div className="flex gap-4 my-3 text-xs text-text-3 font-mono">
                <span>{formatCount(u.followersCount)} abonnés</span>
                <span>{u.postsCount} posts</span>
              </div>
              <div className="flex gap-2 w-full">
                <Link href={`/profile/${u.id}`} className="flex-1 btn-ghost text-center text-xs py-2">Profil</Link>
                <button onClick={() => toggleFollow(u)} disabled={followLoading.has(u.id)}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-[10px] transition-all",
                    u.isFollowing
                      ? "bg-surface-3 text-text-2 hover:bg-red-50 hover:text-red-500"
                      : "bg-primary-50 text-primary hover:bg-primary hover:text-white"
                  )}>
                  {followLoading.has(u.id) ? <Loader2 size={12} className="animate-spin" /> :
                    u.isFollowing ? <><UserCheck size={13} /> Abonné</> : <><UserPlus size={13} /> Suivre</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
