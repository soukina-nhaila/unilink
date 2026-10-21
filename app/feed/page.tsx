"use client";
import { useEffect, useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { useFeed } from "@/hooks/useFeed";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { deletePost } from "@/store/slices/feedSlice";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { Spinner } from "@/components/ui/Spinner";
import { FeedTab } from "@/types";
import { cn } from "@/lib/utils";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "forYou",    label: "Pour toi" },
  { id: "following", label: "Abonnements" },
  { id: "popular",   label: "Populaire" },
];

export default function FeedPage() {
  const dispatch = useAppDispatch();
  const { posts, isLoading, hasMore, loadFeed, handleLike, handleSave } = useFeed();
  const [activeTab, setActiveTab] = useState<FeedTab>("forYou");

  useEffect(() => { loadFeed(activeTab, true); }, [activeTab]);

  const handleDelete = useCallback((postId: string) => {
    dispatch(deletePost(postId));
  }, [dispatch]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-1 flex items-center gap-2">
          Fil d'actualité <Sparkles size={20} className="text-primary" />
        </h1>
        <div className="flex gap-1 bg-surface-3 p-1 rounded-[10px]">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("px-4 py-1.5 rounded-[8px] text-sm font-medium transition-all",
                activeTab === id ? "bg-white text-primary shadow-card" : "text-text-2 hover:text-text-1")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <CreatePost />

      <div className="space-y-4">
        {isLoading && posts.length === 0 ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post.id} post={post}
                onLike={handleLike} onSave={handleSave} onDelete={handleDelete} />
            ))}
            {isLoading && <div className="flex justify-center py-4"><Spinner /></div>}
            {!isLoading && !hasMore && posts.length > 0 && (
              <div className="text-center py-8 text-text-3 text-sm">
                🎓 Tu es à jour ! Reviens plus tard.
              </div>
            )}
            {!isLoading && posts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-semibold text-text-1">Aucune publication</p>
                <p className="text-sm text-text-3 mt-1">Suis des camarades pour voir leur contenu !</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
