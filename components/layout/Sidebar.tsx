"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, TrendingUp, Users, MessageCircle, Bell, User, Settings, LogOut, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppSelector } from "@/hooks/useAppSelector";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href:"/feed",          label:"Fil d'actualité", icon:Home },
  { href:"/search",        label:"Recherche",        icon:Search },
  { href:"/trending",      label:"Tendances",        icon:TrendingUp },
];
const socialLinks = [
  { href:"/friends",       label:"Amis",             icon:Users },
  { href:"/messages",      label:"Messages",         icon:MessageCircle },
  { href:"/notifications", label:"Notifications",    icon:Bell, badge:"notif" },
];
const accountLinks = [
  { href:"/profile/me",    label:"Mon Profil",       icon:User },
  { href:"/settings",      label:"Paramètres",       icon:Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const unreadCount = useAppSelector(s => s.notifications.unreadCount);

  if (!user) return null;

  const NavItem = ({ href, label, icon: Icon, badge }: any) => {
    const active = pathname === href || (href !== "/feed" && pathname.startsWith(href));
    return (
      <Link href={href}
        className={cn("nav-link", active && "active")}>
        <Icon size={18} />
        <span className="flex-1">{label}</span>
        {badge === "notif" && unreadCount > 0 && (
          <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full font-mono">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="sticky top-0 h-screen flex flex-col bg-white border-r border-border overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-primary flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-white fill-white" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight text-primary leading-none">UniLink</p>
          <p className="text-[10px] text-text-3 font-medium uppercase tracking-widest mt-0.5">Réseau Étudiant</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-3 px-3 mb-2">Principal</p>
          {mainLinks.map(l => <NavItem key={l.href} {...l} />)}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-3 px-3 mb-2">Social</p>
          {socialLinks.map(l => <NavItem key={l.href} {...l} />)}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-3 px-3 mb-2">Compte</p>
          {accountLinks.map(l => <NavItem key={l.href} {...l} />)}
        </div>
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 p-2.5 rounded-[10px] hover:bg-surface-2 transition-colors cursor-pointer group">
          <Avatar user={user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-1 truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-text-3 truncate">{user.department} · {user.level}</p>
          </div>
          <button onClick={logout}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-3 hover:text-red-500 p-1 rounded-lg"
            title="Déconnexion">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
