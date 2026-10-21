"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, TrendingUp, Send, Trash2, Loader2 } from "lucide-react";
import { Post } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { commentsAPI, postsAPI } from "@/lib/api";
import { timeAgo, formatCount } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Comment {
  id: string; postId: string;
  author: any; content: string;
  likesCount: number; isLiked: boolean; createdAt: string;
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string, isLiked: boolean) => void;
  onSave: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onLike, onSave, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText]   = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [showMenu, setShowMenu]         = useState(false);
  const [localLiked, setLocalLiked]     = useState(post.isLiked);
  const [localLikes, setLocalLikes]     = useState(post.likesCount);
  const [localSaved, setLocalSaved]     = useState(post.isSaved);
  const [sharing, setSharing]           = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);

  useEffect(() => {
    setLocalLiked(post.isLiked);
    setLocalLikes(post.likesCount);
    setLocalSaved(post.isSaved);
  }, [post.isLiked, post.likesCount, post.isSaved]);

  // ── Guard : post sans auteur (auteur supprimé) → on n'affiche rien ────────
  if (!post.author) return null;

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await commentsAPI.getByPost(post.id);
        setComments(res.data.comments || []);
      } catch {} finally { setLoadingComments(false); }
    }
    setShowComments(v => !v);
  };

  const handleLike = () => {
    setLocalLiked(v => !v);
    setLocalLikes(v => localLiked ? v - 1 : v + 1);
    onLike(post.id, localLiked);
  };

  const handleSave = () => {
    setLocalSaved(v => !v);
    onSave(post.id);
  };

  const handleShare = async () => {
    setSharing(true);
    try { await postsAPI.share(post.id); } catch {} finally { setSharing(false); }
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await commentsAPI.create(post.id, commentText);
      setComments(prev => [...prev, res.data]);
      setCommentsCount(v => v + 1);
      setCommentText("");
    } catch {} finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsAPI.delete(post.id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentsCount(v => Math.max(0, v - 1));
    } catch {}
  };

  const isAuthor = !!user?.id && user.id === post.author.id;

  return (
      <article className="card hover:border-primary-200 transition-all duration-200 animate-fade-up">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Link href={`/profile/${post.author.id}`}>
            <Avatar user={post.author} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${post.author.id}`}
                    className="font-semibold text-sm text-text-1 hover:text-primary transition-colors">
                {post.author.firstName} {post.author.lastName}
              </Link>
              {post.isTrending && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> Tendance
              </span>
              )}
            </div>
            <p className="text-xs text-text-3 mt-0.5">
              <span className="text-primary font-semibold">{post.author.department}</span>
              {" · "}{post.author.level}{" · "}{timeAgo(post.createdAt)}
            </p>
          </div>

          {/* Menu */}
          <div className="relative">
            <button onClick={() => setShowMenu(v => !v)}
                    className="p-1.5 rounded-lg text-text-3 hover:bg-surface-2 hover:text-text-1 transition-colors">
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
                <div className="absolute right-0 top-8 bg-white border border-border rounded-[12px] shadow-card z-20 py-1 min-w-[150px]"
                     onMouseLeave={() => setShowMenu(false)}>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.origin + `/feed`); setShowMenu(false); }}
                          className="w-full text-left text-sm px-4 py-2 hover:bg-surface-2 text-text-2">
                    Copier le lien
                  </button>
                  <button className="w-full text-left text-sm px-4 py-2 hover:bg-surface-2 text-text-2">
                    Signaler
                  </button>
                  {isAuthor && (
                      <button onClick={() => { onDelete?.(post.id); setShowMenu(false); }}
                              className="w-full text-left text-sm px-4 py-2 hover:bg-red-50 text-red-500 flex items-center gap-2">
                        <Trash2 size={13} /> Supprimer
                      </button>
                  )}
                </div>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-text-2 leading-relaxed mb-3 whitespace-pre-line">{post.content}</p>
        {(post.images?.length ?? 0) > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {post.images?.map((img, index) => (
                  <img key={index} src={img} alt="" className="rounded-lg w-full" />
              ))}
            </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map(tag => (
                  <span key={tag}
                        className="text-[11px] font-semibold bg-primary-50 text-primary-800 px-2.5 py-1 rounded-full cursor-pointer hover:bg-primary-100 transition-colors">
              #{tag}
            </span>
              ))}
            </div>
        )}
        {post.location && <div>📍 {post.location}</div>}
        {post.poll && (
            <div>
              <h4>{post.poll.question}</h4>
              {post.poll.options.map(option => (
                  <button key={option.id}>{option.text}</button>
              ))}
            </div>
        )}

        <div className="divider" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button onClick={handleLike}
                  className={cn("flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-sm font-medium transition-all",
                      localLiked ? "text-pink-500 bg-pink-50" : "text-text-2 hover:bg-surface-2 hover:text-pink-500")}>
            <Heart size={15} className={localLiked ? "fill-pink-500" : ""} />
            <span className="font-mono text-xs">{formatCount(localLikes)}</span>
          </button>

          <button onClick={toggleComments}
                  className={cn("flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-sm font-medium transition-all",
                      showComments ? "text-primary bg-primary-50" : "text-text-2 hover:bg-surface-2 hover:text-primary")}>
            <MessageCircle size={15} />
            <span className="font-mono text-xs">{formatCount(commentsCount)}</span>
          </button>

          <button onClick={handleShare} disabled={sharing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-sm font-medium text-text-2 hover:bg-surface-2 hover:text-primary transition-all">
            {sharing ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
            <span className="text-xs">Partager</span>
          </button>

          <button onClick={handleSave}
                  className={cn("ml-auto p-2 rounded-[8px] transition-all",
                      localSaved ? "text-primary bg-primary-50" : "text-text-3 hover:bg-surface-2 hover:text-primary")}>
            <Bookmark size={15} className={localSaved ? "fill-primary" : ""} />
          </button>
        </div>

        {/* Comments */}
        {showComments && (
            <div className="mt-3 pt-3 border-t border-border space-y-3">
              {loadingComments ? (
                  <div className="flex justify-center py-3"><Spinner /></div>
              ) : comments.length === 0 ? (
                  <p className="text-center text-xs text-text-3 py-2">Aucun commentaire — sois le premier !</p>
              ) : (
                  comments
                      .filter(c => c.author != null) // ── guard commentaires orphelins
                      .map(c => (
                          <div key={c.id} className="flex gap-2.5 group">
                            <Avatar user={c.author} size="xs" />
                            <div className="flex-1 bg-surface-2 rounded-[10px] px-3 py-2">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-text-1">{c.author.firstName} {c.author.lastName}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-text-3">{timeAgo(c.createdAt)}</span>
                                  {user?.id === c.author.id && (
                                      <button onClick={() => handleDeleteComment(c.id)}
                                              className="opacity-0 group-hover:opacity-100 transition-opacity text-text-3 hover:text-red-500">
                                        <Trash2 size={11} />
                                      </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-text-2 mt-1 leading-relaxed">{c.content}</p>
                            </div>
                          </div>
                      ))
              )}

              {user && (
                  <div className="flex gap-2.5">
                    <Avatar user={user} size="xs" />
                    <div className="flex-1 flex gap-2">
                      <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                             onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleComment()}
                             placeholder="Ajouter un commentaire..."
                             className="input text-xs flex-1" />
                      <button onClick={handleComment} disabled={!commentText.trim() || submitting}
                              className="p-2 rounded-[8px] bg-primary-50 text-primary hover:bg-primary hover:text-white transition-all flex-shrink-0 disabled:opacity-50">
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>
                  </div>
              )}
            </div>
        )}
      </article>
  );
}