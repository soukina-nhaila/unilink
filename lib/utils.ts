import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  } catch {
    return "";
  }
}

export function formatDate(date: string | Date): string {
  try {
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  } catch {
    return "";
  }
}

export function getInitials(firstName: string, lastName: string): string {
  return `${(firstName?.[0] || "").toUpperCase()}${(lastName?.[0] || "").toUpperCase()}`;
}

export function formatCount(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export const AVATAR_COLORS = [
  { bg: "#EDE9FE", text: "#6C4FF6" },
  { bg: "#FCE7F3", text: "#DB2777" },
  { bg: "#D1FAE5", text: "#047857" },
  { bg: "#FEF3C7", text: "#B45309" },
  { bg: "#E0F2FE", text: "#0369A1" },
  { bg: "#FEE2E2", text: "#DC2626" },
  { bg: "#ECFDF5", text: "#059669" },
];

export function getAvatarColor(id: string) {
  const idx = (id?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
