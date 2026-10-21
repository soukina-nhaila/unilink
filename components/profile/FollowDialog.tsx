"use client";
import { X, Loader2, UserCheck, UserMinus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { usersAPI } from "@/lib/api";
import { useState } from "react";

interface FollowUser {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    department: string;
    level: string;
    isFollowing: boolean;
}

interface Props {
    type: "followers" | "following";
    users: FollowUser[];
    loading: boolean;
    isMyProfile: boolean;
    onClose: () => void;
    onUserRemoved: (userId: string) => void;
}

export function FollowDialog({ type, users, loading, isMyProfile, onClose, onUserRemoved }: Props) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleAction = async (u: FollowUser) => {
        setLoadingId(u.id);
        try {
            await usersAPI.unfollow(u.id);
            onUserRemoved(u.id);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        // Fond sombre derrière la modal
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={onClose}
        >
            {/* Boîte blanche — stoppe la propagation du click */}
            <div
                className="bg-white rounded-2xl shadow-2xl w-full mx-4 overflow-hidden"
                style={{ maxWidth: 420 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1A1333" }}>
                        {type === "followers" ? "Abonnés" : "Abonnements"}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: "50%", border: "none",
                            background: "#F3F3F8", cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <X size={16} color="#6B6885" />
                    </button>
                </div>

                {/* Contenu */}
                <div style={{ overflowY: "auto", maxHeight: "60vh" }}>
                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                            <Loader2 size={28} className="animate-spin" style={{ color: "#6C4FF6" }} />
                        </div>
                    ) : users.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 0", color: "#A09DBF", fontSize: 14 }}>
                            {type === "followers" ? "Aucun abonné pour l'instant" : "Aucun abonnement pour l'instant"}
                        </div>
                    ) : (
                        users.map((u) => (
                            <div
                                key={u.id}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "12px 20px", borderBottom: "1px solid #F3F3F8",
                                }}
                            >
                                {/* Avatar + nom cliquables */}
                                <Link href={`/profile/${u.id}`} onClick={onClose} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                                    <Avatar user={u} size="sm" />
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: 14, color: "#1A1333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {u.firstName} {u.lastName}
                                        </p>
                                        <p style={{ fontSize: 11, color: "#A09DBF", marginTop: 1 }}>
                                            {u.department} · {u.level}
                                        </p>
                                    </div>
                                </Link>

                                {/* Badge état */}
                                <span
                                    style={{
                                        fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, flexShrink: 0,
                                        background: u.isFollowing ? "#EDE9FE" : "#F3F3F8",
                                        color: u.isFollowing ? "#6C4FF6" : "#A09DBF",
                                    }}
                                >
                  {u.isFollowing ? "Abonné ✓" : "Non suivi"}
                </span>

                                {/* Bouton action — seulement sur mon profil */}
                                {isMyProfile && (
                                    <button
                                        onClick={() => handleAction(u)}
                                        disabled={loadingId === u.id}
                                        title={type === "followers" ? "Retirer cet abonné" : "Se désabonner"}
                                        style={{
                                            width: 32, height: 32, borderRadius: "50%", border: "none",
                                            background: "#FEE2E2", cursor: "pointer", flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}
                                    >
                                        {loadingId === u.id ? (
                                            <Loader2 size={14} className="animate-spin" style={{ color: "#EF4444" }} />
                                        ) : (
                                            <UserMinus size={14} color="#EF4444" />
                                        )}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
