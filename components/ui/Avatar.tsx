"use client";
import { getInitials, getAvatarColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { User } from "@/types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, { px: number; fontSize: number }> = {
    xs: { px: 28,  fontSize: 10 },
    sm: { px: 36,  fontSize: 13 },
    md: { px: 44,  fontSize: 15 },
    lg: { px: 60,  fontSize: 20 },
    xl: { px: 80,  fontSize: 26 },
};

interface AvatarProps {
    user: Pick<User, "id" | "firstName" | "lastName" | "avatar">;
    size?: Size;
    className?: string;
    showRing?: boolean;
}

export function Avatar({ user, size = "md", className, showRing }: AvatarProps) {
    const { px, fontSize } = sizeMap[size];
    const color = getAvatarColor(user.id);
    const initials = getInitials(user.firstName, user.lastName);

    // Si l'utilisateur a une vraie photo, on l'affiche
    if (user.avatar) {
        return (
            <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className={cn("rounded-full object-cover flex-shrink-0 select-none", className)}
                style={{
                    width: px,
                    height: px,
                    boxShadow: showRing ? "0 0 0 2px #EDE9FE" : undefined,
                }}
            />
        );
    }

    // Sinon on affiche les initiales colorées
    return (
        <div
            className={cn("rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none", className)}
            style={{
                width: px,
                height: px,
                fontSize,
                backgroundColor: color.bg,
                color: color.text,
                boxShadow: showRing ? "0 0 0 2px #EDE9FE" : undefined,
                lineHeight: 1,
            }}
        >
            {initials}
        </div>
    );
}
