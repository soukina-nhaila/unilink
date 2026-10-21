// components/feed/TagInput.tsx
"use client";
import { useState, useRef, KeyboardEvent } from "react";
import { X, Hash } from "lucide-react";

const TAG_SUGGESTIONS = [
    "MachineLearning", "DataScience", "WebDev", "React", "NextJS",
    "Informatique", "Mathématiques", "Physique", "Économie", "Droit",
    "Robotique", "IA", "Université", "CoursPartage", "Entraide",
    "Événement", "Projet", "Stage", "Emploi", "Concours",
];

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    maxTags?: number;
}

export function TagInput({ tags, onChange, maxTags = 5 }: TagInputProps) {
    const [input, setInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = TAG_SUGGESTIONS.filter(t =>
        t.toLowerCase().includes(input.toLowerCase().replace("#", "")) &&
        !tags.includes(t) && input.length > 0
    );

    const addTag = (tag: string) => {
        const clean = tag.replace(/^#/, "").trim();
        if (!clean || tags.includes(clean) || tags.length >= maxTags) return;
        onChange([...tags, clean]);
        setInput("");
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag));

    const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === " " || e.key === ",") && input.trim()) {
            e.preventDefault();
            addTag(input);
        }
        if (e.key === "Backspace" && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div style={{ marginTop: 10, position: "relative" }}>
            <div
                onClick={() => inputRef.current?.focus()}
                style={{
                    display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
                    background: "#F8F7FF", borderRadius: 8, padding: "6px 10px",
                    border: "1px solid #E8E5FF", cursor: "text", minHeight: 38,
                }}>
                <Hash size={14} color="#6C4FF6" style={{ flexShrink: 0 }} />

                {/* Tags existants */}
                {tags.map(tag => (
                    <span key={tag} style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "#EDE9FE", color: "#6C4FF6",
                        fontSize: 12, fontWeight: 600,
                        padding: "2px 8px", borderRadius: 20,
                    }}>
            #{tag}
                        <button onClick={() => removeTag(tag)}
                                style={{ border: "none", background: "none", cursor: "pointer", color: "#A09DBF", padding: 0, lineHeight: 1 }}>
              <X size={11} />
            </button>
          </span>
                ))}

                {/* Input */}
                {tags.length < maxTags && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
                        onKeyDown={handleKey}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder={tags.length === 0 ? "Ajouter des hashtags..." : ""}
                        style={{
                            border: "none", background: "transparent", outline: "none",
                            fontSize: 13, fontFamily: "inherit", minWidth: 120, flex: 1,
                        }}
                    />
                )}
            </div>

            <p style={{ fontSize: 11, color: "#A09DBF", marginTop: 4 }}>
                Appuyez sur Espace ou Entrée pour ajouter · {tags.length}/{maxTags}
            </p>

            {/* Suggestions */}
            {showSuggestions && filtered.length > 0 && (
                <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                    background: "white", border: "1px solid #E8E5FF", borderRadius: 10,
                    boxShadow: "0 4px 16px rgba(108,79,246,0.12)", marginTop: 2,
                    display: "flex", flexWrap: "wrap", gap: 6, padding: 10,
                }}>
                    {filtered.slice(0, 8).map(t => (
                        <button key={t} onClick={() => addTag(t)}
                                style={{
                                    padding: "4px 10px", borderRadius: 20, border: "1px solid #E8E5FF",
                                    background: "#F8F7FF", color: "#6C4FF6", fontSize: 12,
                                    fontWeight: 600, cursor: "pointer",
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EDE9FE"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F8F7FF"; }}>
                            #{t}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}