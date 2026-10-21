"use client";
import { useEffect } from "react";
import { Heart, MessageCircle, UserPlus, AtSign, Share2, CheckCheck } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/store/slices/notificationsSlice";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { timeAgo, cn } from "@/lib/utils";
import { Notification } from "@/types";
import Link from "next/link";

const NOTIF_ICON: Record<string, { bg: string; icon: React.ReactNode }> = {
  like:    { bg:"bg-pink-400",    icon:<Heart    size={11} className="text-white"/> },
  comment: { bg:"bg-primary",     icon:<MessageCircle size={11} className="text-white"/> },
  follow:  { bg:"bg-emerald-400", icon:<UserPlus size={11} className="text-white"/> },
  mention: { bg:"bg-amber-400",   icon:<AtSign   size={11} className="text-white"/> },
  share:   { bg:"bg-blue-400",    icon:<Share2   size={11} className="text-white"/> },
};

function notifText(n: Notification) {
  const name = `${n.actor.firstName} ${n.actor.lastName}`;
  const labels: Record<string, string> = {
    like:    "a aimé votre publication",
    comment: "a commenté votre post",
    follow:  "a commencé à vous suivre",
    mention: "vous a mentionné dans un commentaire",
    share:   "a partagé votre publication",
  };
  return <><span className="font-semibold text-text-1">{name}</span> <span className="text-text-2">{labels[n.type]}</span></>;
}

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, isLoading } = useAppSelector(s => s.notifications);

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  const handleMarkAll = () => dispatch(markAllNotificationsRead());
  const handleMarkOne = (id: string) => dispatch(markNotificationRead(id));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Notifications 🔔</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-text-3 mt-0.5">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-700 transition-colors">
            <CheckCheck size={16} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-text-3">
          <p className="text-4xl mb-3">🔕</p>
          <p className="font-semibold text-text-1">Aucune notification</p>
          <p className="text-sm mt-1">Tes notifications apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const ic = NOTIF_ICON[n.type] || NOTIF_ICON.like;
            return (
              <div key={n.id} onClick={() => handleMarkOne(n.id)}
                className={cn("card flex items-center gap-3 cursor-pointer hover:border-primary-200 transition-all",
                  !n.read && "bg-primary-50/40 border-primary-100")}>
                <div className="relative flex-shrink-0">
                  <Link href={`/profile/${n.actor.id}`} onClick={e => e.stopPropagation()}>
                    <Avatar user={n.actor} size="sm" />
                  </Link>
                  <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center", ic.bg)}>
                    {ic.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">{notifText(n)}</p>
                  <p className="text-xs text-text-3 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
