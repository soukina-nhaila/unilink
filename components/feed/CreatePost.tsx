// components/feed/CreatePost.tsx
"use client";
import { useState, useRef } from "react";
import { X, Loader2, ImageIcon, BarChart3, MapPin, Hash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFeed } from "@/hooks/useFeed";
import { Avatar } from "@/components/ui/Avatar";
import { ImageUpload } from "./ImageUpload";
import { PollCreator, PollData } from "./PollCreator";
import { LocationPicker } from "./LocationPicker";
import { TagInput } from "./TagInput";

export function CreatePost() {
  const { user } = useAuth();
  const { handleCreate } = useFeed();

  const [content, setContent]     = useState("");
  const [images, setImages]       = useState<string[]>([]);
  const [poll, setPoll]           = useState<PollData | null>(null);
  const [location, setLocation]   = useState("");
  const [tags, setTags]           = useState<string[]>([]);
  const [expanded, setExpanded]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [activePanel, setActivePanel] = useState<"photo"|"poll"|"location"|"tag"|null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 4 - images.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const togglePanel = (panel: "photo"|"poll"|"location"|"tag") => {
    if (panel === "photo") {
      // Photo: ouvre directement le sélecteur de fichier
      fileInputRef.current?.click();
      return;
    }
    if (panel === "poll" && images.length > 0) return; // poll incompatible avec images
    setActivePanel(prev => prev === panel ? null : panel);
    if (panel === "poll" && activePanel !== "poll") setPoll({
      question: "",
      options: [{ id: "opt1", text: "" }, { id: "opt2", text: "" }],
      expiresIn: "1d",
    });
    if (panel === "poll" && activePanel === "poll") setPoll(null);
    if (panel === "location" && activePanel !== "location") setLocation(" ");
    if (panel === "location" && activePanel === "location") { setLocation(""); }
    if (panel === "tag" && activePanel !== "tag") {}
    setExpanded(true);
  };

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      await handleCreate({
        content,
        tags,
        images,       // base64 strings — le backend les stockera (ou vous pouvez intégrer Cloudinary)
        location: location.trim(),
        poll: poll ? {
          question: poll.question,
          options: poll.options.map(o => ({ id: o.id, text: o.text, votes: 0, voters: [] })),
          expiresAt: new Date(Date.now() + (
              poll.expiresIn === "1d" ? 86400000 :
                  poll.expiresIn === "3d" ? 259200000 : 604800000
          )),
          totalVotes: 0,
        } : undefined,
      });
      // Reset
      setContent(""); setImages([]); setPoll(null);
      setLocation(""); setTags([]); setExpanded(false); setActivePanel(null);
    } finally { setLoading(false); }
  };

  const canPublish = content.trim() && (
      !poll || (poll.question.trim() && poll.options.filter(o => o.text.trim()).length >= 2)
  );

  return (
      <div style={{
        background: "#fff", borderRadius: 14, border: "1px solid #E8E5FF",
        padding: 16, marginBottom: 16, boxShadow: "0 2px 12px rgba(108,79,246,0.08)",
      }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Avatar user={user} size="sm" />
          <div style={{ flex: 1 }}>
          <textarea
              ref={textareaRef}
              value={content}
              onChange={e => { setContent(e.target.value); autoResize(); }}
              onFocus={() => setExpanded(true)}
              placeholder="Partage quelque chose avec tes collègues... 🎓"
              rows={expanded ? 3 : 2}
              style={{
                width: "100%", background: "transparent", border: "none",
                outline: "none", resize: "none", fontSize: 14,
                fontFamily: "inherit", color: "#1A1333", lineHeight: 1.6,
              }}
          />

            {/* Images preview */}
            <ImageUpload images={images} onChange={setImages} />

            {/* Sondage */}
            {poll && <PollCreator poll={poll} onChange={setPoll} />}

            {/* Lieu */}
            {(activePanel === "location" || location.trim()) && (
                <LocationPicker location={location.trim()} onChange={setLocation} />
            )}

            {/* Tags */}
            {(activePanel === "tag" || tags.length > 0) && (
                <TagInput tags={tags} onChange={setTags} />
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8E5FF",
        }}>
          {/* Photo */}
          <button
              onClick={() => togglePanel("photo")}
              disabled={!!poll}
              title={poll ? "Indisponible avec un sondage" : "Ajouter des photos"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px", borderRadius: 8, border: "none",
                background: images.length > 0 ? "#EDE9FE" : "none",
                cursor: poll ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: 500,
                color: images.length > 0 ? "#6C4FF6" : "#6B6885",
                opacity: poll ? 0.4 : 1,
              }}>
            <ImageIcon size={14} />
            Photo {images.length > 0 && `(${images.length})`}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageFiles} />

          {/* Sondage */}
          <button
              onClick={() => togglePanel("poll")}
              disabled={images.length > 0}
              title={images.length > 0 ? "Indisponible avec des photos" : "Créer un sondage"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px", borderRadius: 8, border: "none",
                background: poll ? "#EDE9FE" : "none",
                cursor: images.length > 0 ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: 500,
                color: poll ? "#6C4FF6" : "#6B6885",
                opacity: images.length > 0 ? 0.4 : 1,
              }}>
            <BarChart3 size={14} />
            Sondage
          </button>

          {/* Lieu */}
          <button
              onClick={() => togglePanel("location")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px", borderRadius: 8, border: "none",
                background: location.trim() ? "#EDE9FE" : "none",
                cursor: "pointer", fontSize: 12, fontWeight: 500,
                color: location.trim() ? "#6C4FF6" : "#6B6885",
              }}>
            <MapPin size={14} />
            {location.trim() ? location.trim().slice(0, 12) + (location.length > 12 ? "…" : "") : "Lieu"}
          </button>

          {/* Tag */}
          <button
              onClick={() => togglePanel("tag")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px", borderRadius: 8, border: "none",
                background: tags.length > 0 ? "#EDE9FE" : "none",
                cursor: "pointer", fontSize: 12, fontWeight: 500,
                color: tags.length > 0 ? "#6C4FF6" : "#6B6885",
              }}>
            <Hash size={14} />
            Tag {tags.length > 0 && `(${tags.length})`}
          </button>

          {/* Boutons droite */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {expanded && (
                <button
                    onClick={() => {
                      setExpanded(false); setContent(""); setImages([]);
                      setPoll(null); setLocation(""); setTags([]); setActivePanel(null);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", color: "#A09DBF" }}>
                  <X size={15} />
                </button>
            )}
            <button
                onClick={handleSubmit}
                disabled={!canPublish || loading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 10,
                  background: canPublish ? "#6C4FF6" : "#E8E5FF",
                  color: canPublish ? "#fff" : "#A09DBF",
                  border: "none", cursor: canPublish ? "pointer" : "not-allowed",
                  fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                }}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              Publier →
            </button>
          </div>
        </div>
      </div>
  );
}