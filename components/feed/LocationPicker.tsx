// components/feed/LocationPicker.tsx
"use client";
import { useState } from "react";
import { MapPin, X, Loader2 } from "lucide-react";

const SUGGESTIONS = [
    "Bibliothèque universitaire",
    "Amphi A", "Amphi B", "Amphi C",
    "Cafétéria", "Salle informatique",
    "Laboratoire de recherche",
    "Campus principal",
    "Résidence universitaire",
    "Salle de sport",
];

interface LocationPickerProps {
    location: string;
    onChange: (location: string) => void;
}

export function LocationPicker({ location, onChange }: LocationPickerProps) {
    const [input, setInput] = useState(location);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filtered = SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(input.toLowerCase()) && input.length > 0
    );

    const useGPS = () => {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    // Reverse geocoding avec l'API Nominatim (gratuite, pas de clé)
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
                    );
                    const data = await res.json();
                    const loc = data.address?.city || data.address?.town || data.display_name?.split(",")[0] || "Position actuelle";
                    setInput(loc);
                    onChange(loc);
                } catch {
                    setInput("Position actuelle");
                    onChange("Position actuelle");
                } finally { setLoading(false); }
            },
            () => { setLoading(false); alert("Géolocalisation refusée"); },
            { timeout: 8000 }
        );
    };

    if (!location && input === "") return null;

    return (
        <div style={{ marginTop: 10, position: "relative" }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#F8F7FF", borderRadius: 8, padding: "6px 10px",
                border: "1px solid #E8E5FF",
            }}>
                <MapPin size={14} color="#6C4FF6" />
                <input
                    type="text"
                    value={input}
                    onChange={e => { setInput(e.target.value); onChange(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Ajouter un lieu..."
                    style={{
                        flex: 1, border: "none", background: "transparent",
                        fontSize: 13, fontFamily: "inherit", outline: "none", color: "#1A1333",
                    }}
                />
                {loading && <Loader2 size={14} color="#6C4FF6" className="animate-spin" />}
                {input && (
                    <button onClick={() => { setInput(""); onChange(""); }}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#A09DBF" }}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Suggestions */}
            {showSuggestions && (filtered.length > 0 || !input) && (
                <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                    background: "white", border: "1px solid #E8E5FF", borderRadius: 10,
                    boxShadow: "0 4px 16px rgba(108,79,246,0.12)", marginTop: 4,
                    overflow: "hidden",
                }}>
                    {/* GPS */}
                    <button onClick={useGPS}
                            style={{
                                width: "100%", padding: "9px 12px", border: "none", borderBottom: "1px solid #E8E5FF",
                                background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                                fontSize: 13, color: "#6C4FF6", fontWeight: 600,
                            }}>
                        📍 Utiliser ma position GPS
                    </button>
                    {(filtered.length > 0 ? filtered : SUGGESTIONS.slice(0, 5)).map(s => (
                        <button key={s}
                                onClick={() => { setInput(s); onChange(s); setShowSuggestions(false); }}
                                style={{
                                    width: "100%", padding: "8px 12px", border: "none",
                                    background: "none", cursor: "pointer", textAlign: "left",
                                    fontSize: 13, color: "#1A1333", display: "flex", alignItems: "center", gap: 8,
                                }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F8F7FF"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>
                            <MapPin size={12} color="#A09DBF" /> {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Affichage du lieu dans PostCard
export function LocationBadge({ location }: { location: string }) {
    if (!location) return null;
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "#EDE9FE", color: "#6C4FF6",
            fontSize: 11, fontWeight: 600, padding: "3px 10px",
            borderRadius: 20, marginBottom: 10,
        }}>
            <MapPin size={11} /> {location}
        </div>
    );
}