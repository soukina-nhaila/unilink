// components/feed/ImageUpload.tsx
"use client";
import { useState, useRef } from "react";
import { X, Upload, ImageIcon } from "lucide-react";

interface ImageUploadProps {
    images: string[];           // base64 ou URLs preview
    onChange: (images: string[]) => void;
    maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 4 }: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remaining = maxImages - images.length;
        const toProcess = files.slice(0, remaining);

        toProcess.forEach(file => {
            // Vérification taille (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} dépasse 5MB`);
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target?.result as string;
                onChange([...images, base64]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input pour permettre re-sélection du même fichier
        e.target.value = "";
    };

    const removeImage = (index: number) => {
        onChange(images.filter((_, i) => i !== index));
    };

    if (images.length === 0) return null;

    return (
        <div style={{ marginTop: 12 }}>
            {/* Grille des images */}
            <div style={{
                display: "grid",
                gridTemplateColumns: images.length === 1 ? "1fr" : "1fr 1fr",
                gap: 8,
                borderRadius: 12,
                overflow: "hidden",
            }}>
                {images.map((src, i) => (
                    <div key={i} style={{ position: "relative", aspectRatio: images.length === 1 ? "16/9" : "1" }}>
                        <img
                            src={src}
                            alt={`Image ${i + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }}
                        />
                        <button
                            onClick={() => removeImage(i)}
                            style={{
                                position: "absolute", top: 6, right: 6,
                                width: 24, height: 24, borderRadius: "50%",
                                background: "rgba(0,0,0,0.6)", border: "none",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                        >
                            <X size={14} color="white" />
                        </button>
                    </div>
                ))}

                {/* Bouton ajouter plus */}
                {images.length < maxImages && (
                    <button
                        onClick={() => inputRef.current?.click()}
                        style={{
                            aspectRatio: "1", borderRadius: 10, border: "2px dashed #E8E5FF",
                            background: "#F8F7FF", cursor: "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            gap: 6, color: "#A09DBF", fontSize: 12, fontWeight: 500,
                        }}
                    >
                        <Upload size={20} />
                        Ajouter
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}

// Bouton déclencheur à mettre dans la toolbar de CreatePost
export function ImageUploadTrigger({
                                       onFilesSelected,
                                       disabled,
                                   }: {
    onFilesSelected: (files: string[]) => void;
    disabled?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = ev => {
                onFilesSelected([ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    return (
        <>
            <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 10px", borderRadius: 8, border: "none",
                    background: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 500, color: "#6B6885",
                }}
            >
                <ImageIcon size={14} /> Photo
            </button>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handle} />
        </>
    );
}