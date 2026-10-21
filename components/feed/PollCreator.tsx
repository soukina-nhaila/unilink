// components/feed/PollCreator.tsx
"use client";
import { useState } from "react";
import { Plus, X, BarChart3 } from "lucide-react";

export interface PollData {
    question: string;
    options: { id: string; text: string }[];
    expiresIn: "1d" | "3d" | "7d";
}

interface PollCreatorProps {
    poll: PollData | null;
    onChange: (poll: PollData | null) => void;
}

const defaultPoll = (): PollData => ({
    question: "",
    options: [
        { id: "opt1", text: "" },
        { id: "opt2", text: "" },
    ],
    expiresIn: "1d",
});

export function PollCreator({ poll, onChange }: PollCreatorProps) {
    if (!poll) return null;

    const updateOption = (id: string, text: string) => {
        onChange({
            ...poll,
            options: poll.options.map(o => o.id === id ? { ...o, text } : o),
        });
    };

    const addOption = () => {
        if (poll.options.length >= 4) return;
        onChange({
            ...poll,
            options: [...poll.options, { id: `opt${Date.now()}`, text: "" }],
        });
    };

    const removeOption = (id: string) => {
        if (poll.options.length <= 2) return;
        onChange({ ...poll, options: poll.options.filter(o => o.id !== id) });
    };

    return (
        <div style={{
            marginTop: 12, background: "#F8F7FF", borderRadius: 12,
            border: "1px solid #E8E5FF", padding: 14,
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#6C4FF6" }}>
                    <BarChart3 size={15} /> Sondage
                </div>
                <button onClick={() => onChange(null)}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#A09DBF" }}>
                    <X size={16} />
                </button>
            </div>

            {/* Question */}
            <input
                type="text"
                value={poll.question}
                onChange={e => onChange({ ...poll, question: e.target.value })}
                placeholder="Votre question..."
                maxLength={200}
                style={{
                    width: "100%", padding: "8px 12px", borderRadius: 8,
                    border: "1px solid #E8E5FF", fontSize: 13, marginBottom: 8,
                    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#6C4FF6"}
                onBlur={e => e.target.style.borderColor = "#E8E5FF"}
            />

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {poll.options.map((opt, i) => (
                    <div key={opt.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <div style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: "#EDE9FE", color: "#6C4FF6",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                            {String.fromCharCode(65 + i)}
                        </div>
                        <input
                            type="text"
                            value={opt.text}
                            onChange={e => updateOption(opt.id, e.target.value)}
                            placeholder={`Option ${i + 1}`}
                            maxLength={100}
                            style={{
                                flex: 1, padding: "7px 10px", borderRadius: 8,
                                border: "1px solid #E8E5FF", fontSize: 13,
                                fontFamily: "inherit", outline: "none",
                            }}
                            onFocus={e => e.target.style.borderColor = "#6C4FF6"}
                            onBlur={e => e.target.style.borderColor = "#E8E5FF"}
                        />
                        {poll.options.length > 2 && (
                            <button onClick={() => removeOption(opt.id)}
                                    style={{ border: "none", background: "none", cursor: "pointer", color: "#A09DBF", padding: 4 }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Ajouter option */}
            {poll.options.length < 4 && (
                <button onClick={addOption}
                        style={{
                            marginTop: 8, display: "flex", alignItems: "center", gap: 6,
                            fontSize: 12, fontWeight: 600, color: "#6C4FF6",
                            border: "none", background: "none", cursor: "pointer", padding: "4px 0",
                        }}>
                    <Plus size={14} /> Ajouter une option
                </button>
            )}

            {/* Durée */}
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#6B6885", fontWeight: 500 }}>Durée :</span>
                {(["1d", "3d", "7d"] as const).map(d => (
                    <button key={d} onClick={() => onChange({ ...poll, expiresIn: d })}
                            style={{
                                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                border: "1px solid", cursor: "pointer",
                                background: poll.expiresIn === d ? "#6C4FF6" : "transparent",
                                color: poll.expiresIn === d ? "#fff" : "#6C4FF6",
                                borderColor: "#6C4FF6",
                            }}>
                        {d === "1d" ? "1 jour" : d === "3d" ? "3 jours" : "7 jours"}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Composant d'affichage du sondage dans PostCard
export function PollDisplay({
                                poll,
                                postId,
                                currentUserId,
                                onVote,
                            }: {
    poll: any;
    postId: string;
    currentUserId?: string;
    onVote: (postId: string, optionId: string) => void;
}) {
    const hasVoted = poll.options.some((o: any) =>
        o.voters?.includes(currentUserId)
    );

    return (
        <div style={{
            margin: "12px 0", background: "#F8F7FF", borderRadius: 12,
            border: "1px solid #E8E5FF", padding: 14,
        }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1333", marginBottom: 10 }}>
                📊 {poll.question}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {poll.options.map((opt: any, i: number) => {
                    const pct = poll.totalVotes > 0
                        ? Math.round((opt.votes / poll.totalVotes) * 100)
                        : 0;
                    const voted = opt.voters?.includes(currentUserId);

                    return (
                        <button key={opt.id}
                                onClick={() => !hasVoted && onVote(postId, opt.id)}
                                disabled={hasVoted}
                                style={{
                                    position: "relative", padding: "9px 12px",
                                    borderRadius: 8, border: `1.5px solid ${voted ? "#6C4FF6" : "#E8E5FF"}`,
                                    background: "white", cursor: hasVoted ? "default" : "pointer",
                                    overflow: "hidden", textAlign: "left",
                                }}>
                            {/* Barre de progression */}
                            {hasVoted && (
                                <div style={{
                                    position: "absolute", left: 0, top: 0, bottom: 0,
                                    width: `${pct}%`, background: voted ? "#EDE9FE" : "#F8F7FF",
                                    transition: "width 0.5s ease",
                                }} />
                            )}
                            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: voted ? 700 : 400, color: voted ? "#6C4FF6" : "#1A1333" }}>
                  {String.fromCharCode(65 + i)}. {opt.text}
                </span>
                                {hasVoted && (
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6C4FF6", fontFamily: "monospace" }}>
                    {pct}%
                  </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
            <p style={{ fontSize: 11, color: "#A09DBF", marginTop: 8, fontFamily: "monospace" }}>
                {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
                {poll.expiresAt && ` · expire le ${new Date(poll.expiresAt).toLocaleDateString("fr-FR")}`}
            </p>
        </div>
    );
}