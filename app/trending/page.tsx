"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Flame, Clock } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { Spinner } from "@/components/ui/Spinner";
import { postsAPI } from "@/lib/api";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { toggleLike, toggleSave } from "@/store/slices/feedSlice";
import { Post } from "@/types";
import { formatCount } from "@/lib/utils";

interface Topic { tag: string; count: number; category: string; }

export default function TrendingPage() {
  const dispatch = useAppDispatch();
  const [posts, setPosts]   = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsAPI.getTrending()
      .then(r => { setPosts(r.data.posts || []); setTopics(r.data.topics || []); })
      .catch(() => { setPosts([]); setTopics([]); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-text-1 mb-5 flex items-center gap-2">
        Tendances <Flame className="text-amber-500" size={22} />
      </h1>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <>
          {topics.length > 0 && (
            <div className="card mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-primary" />
                <h2 className="font-bold text-text-1">Hashtags populaires</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {topics.map((t, i) => (
                  <div key={t.tag} className="flex items-center gap-3 p-3 rounded-[10px] bg-surface-2 hover:bg-primary-50 border border-transparent hover:border-primary-100 transition-all cursor-pointer group">
                    <span className="text-lg font-black font-mono text-text-3 w-6 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-text-1 group-hover:text-primary transition-colors truncate">#{t.tag}</p>
                      <p className="text-xs text-text-3 mt-0.5">{t.category} · {formatCount(t.count)} posts</p>
                    </div>
                    <TrendingUp size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-primary" />
            <h2 className="font-bold text-text-1">Publications en tendance</h2>
          </div>

          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post}
                  onLike={(id, liked) => dispatch(toggleLike({ postId: id, isLiked: liked }))}
                  onSave={(id) => dispatch(toggleSave(id))} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-3">
              <p className="text-3xl mb-2">📈</p>
              <p className="font-medium">Aucune publication en tendance</p>
              <p className="text-sm mt-1">Les posts populaires apparaîtront ici</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
