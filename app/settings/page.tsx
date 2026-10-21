"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Bell, Shield, Palette, LogOut,
  Camera, Loader2, Check, Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  updateProfile, updateSettings, deleteAccount, fetchCurrentUser
} from "@/store/slices/authSlice";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type SettingsTab = "profile" | "notifications" | "privacy" | "appearance";

const profileSchema = z.object({
  firstName:  z.string().min(2, "Minimum 2 caractères"),
  lastName:   z.string().min(2, "Minimum 2 caractères"),
  bio:        z.string().max(300, "Maximum 300 caractères").optional(),
  department: z.string().min(1, "Requis"),
  level:      z.string().min(1, "Requis"),
  university: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const DEPARTMENTS = ["Informatique","IA & Big Data","Génie Civil","Économie & Gestion","Réseaux & Télécoms","Mathématiques","Physique","Chimie","Biologie","Droit"];
const LEVELS      = ["L1","L2","L3","M1","M2","Doctorat"];

const THEMES = [
  { id: "violet", color: "#6C4FF6", label: "Violet" },
  { id: "blue",   color: "#2563EB", label: "Bleu"   },
  { id: "green",  color: "#059669", label: "Vert"   },
  { id: "pink",   color: "#DB2777", label: "Rose"   },
];

const LANGUAGES = [
  { value: "fr", label: "🇫🇷  Français" },
  { value: "ar", label: "🇲🇦  العربية"  },
  { value: "en", label: "🇬🇧  English"  },
];

// Traductions minimalistes pour changer la langue du site
const TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    settings: "Paramètres ⚙️",
    profile: "Profil",
    notifications: "Notifications",
    privacy: "Confidentialité",
    appearance: "Apparence",
    logout: "Déconnexion",
    saveBtn: "Sauvegarder",
    saving: "Sauvegarde...",
    savedMsg: "Sauvegardé !",
    feedTitle: "Fil d'actualité",
    notifTitle: "Notifications",
  },
  en: {
    settings: "Settings ⚙️",
    profile: "Profile",
    notifications: "Notifications",
    privacy: "Privacy",
    appearance: "Appearance",
    logout: "Logout",
    saveBtn: "Save",
    saving: "Saving...",
    savedMsg: "Saved!",
    feedTitle: "News Feed",
    notifTitle: "Notifications",
  },
  ar: {
    settings: "الإعدادات ⚙️",
    profile: "الملف الشخصي",
    notifications: "الإشعارات",
    privacy: "الخصوصية",
    appearance: "المظهر",
    logout: "تسجيل الخروج",
    saveBtn: "حفظ",
    saving: "جارٍ الحفظ...",
    savedMsg: "تم الحفظ!",
    feedTitle: "الصفحة الرئيسية",
    notifTitle: "الإشعارات",
  },
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const dispatch  = useAppDispatch();
  const router    = useRouter();

  const [tab, setTab]             = useState<SettingsTab>("profile");
  const [isSaving, setIsSaving]   = useState(false);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState("");

  // Avatar
  const [avatarPreview, setAvatarPreview]     = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError]         = useState("");

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount]     = useState(false);

  // ── Thème actuel depuis Redux (source de vérité) ─────────────────────────
  const currentTheme    = user?.theme    || "violet";
  const currentLanguage = user?.language || "fr";
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.fr;

  // ── notificationPrefs depuis Redux ───────────────────────────────────────
  const notifPrefs = user?.notificationPrefs || {
    newFollowers: true, likes: true, comments: true,
    mentions: true, directMessages: false, weeklyDigest: false,
  };

  // ── privacySettings depuis Redux ─────────────────────────────────────────
  const privacySettings = user?.privacySettings || {
    privateAccount: false, showEmail: false,
    allowMessages: true, appearInSearch: true,
  };

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName:  user?.firstName  ?? "",
      lastName:   user?.lastName   ?? "",
      bio:        user?.bio        ?? "",
      department: user?.department ?? "",
      level:      user?.level      ?? "",
      university: user?.university ?? "",
    },
  });

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  // ── Upload avatar ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setAvatarError("Image trop grande. Maximum 5 MB."); return; }
    setAvatarError("");

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");
      const token = typeof window !== "undefined" ? localStorage.getItem("unilink_token") : null;
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error || "Erreur lors de l'upload.");
        setAvatarPreview(null);
        return;
      }
      dispatch(fetchCurrentUser());
      flash();
    } catch {
      setAvatarError("Erreur réseau.");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // ── Sauvegarder profil ────────────────────────────────────────────────────
  const onSave = async (data: ProfileForm) => {
    setIsSaving(true); setSaveError("");
    try {
      const res = await dispatch(updateProfile(data));
      if (updateProfile.fulfilled.match(res)) flash();
      else setSaveError("Erreur lors de la sauvegarde");
    } finally { setIsSaving(false); }
  };

  // ── Toggle notification — sauvegarde immédiate MongoDB ────────────────────
  const toggleNotif = async (key: keyof typeof notifPrefs) => {
    const newPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    // Optimistic update via Redux
    await dispatch(updateSettings({ notificationPrefs: newPrefs }));
    flash();
  };

  // ── Toggle privacy — sauvegarde immédiate MongoDB ─────────────────────────
  const togglePrivacy = async (key: keyof typeof privacySettings) => {
    const newSettings = { ...privacySettings, [key]: !privacySettings[key] };
    await dispatch(updateSettings({ privacySettings: newSettings }));
    flash();
  };

  // ── Changer thème — appliqué immédiatement + sauvegardé MongoDB ───────────
  const handleThemeChange = async (themeId: string) => {
    // 1. Appliquer immédiatement le CSS
    const themeColor = THEMES.find(t => t.id === themeId)?.color ?? "#6C4FF6";
    document.documentElement.style.setProperty("--primary", themeColor);
    document.documentElement.style.setProperty("--primary-light", themeColor + "22");

    // 2. Sauvegarder dans MongoDB via Redux
    await dispatch(updateSettings({ theme: themeId }));
    flash();
  };

  // ── Changer langue — appliqué immédiatement + sauvegardé MongoDB ──────────
  const handleLanguageChange = async (lang: string) => {
    // 1. Changer l'attribut HTML lang (utile pour screen readers, fonts arabes)
    document.documentElement.setAttribute("lang", lang);
    // 2. RTL si arabe
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    // 3. Sauvegarder dans MongoDB
    await dispatch(updateSettings({ language: lang }));
    flash();
  };

  // ── Supprimer compte ──────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await dispatch(deleteAccount());
      router.push("/auth/login");
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return null;

  const displayUser = avatarPreview ? { ...user, avatar: avatarPreview } : user;

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "profile",       label: t.profile,       icon: User    },
    { id: "notifications", label: t.notifications, icon: Bell    },
    { id: "privacy",       label: t.privacy,       icon: Shield  },
    { id: "appearance",    label: t.appearance,    icon: Palette },
  ];

  return (
      <div dir={currentLanguage === "ar" ? "rtl" : "ltr"}>
        {/* Flash banner */}
        {saved && (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-500 text-white text-sm font-medium px-4 py-2.5 rounded-[10px] shadow-lg">
              <Check size={14} /> {t.savedMsg}
            </div>
        )}

        <h1 className="text-2xl font-bold tracking-tight text-text-1 mb-5">{t.settings}</h1>
        <div className="grid grid-cols-[200px_1fr] gap-5">

          {/* Side nav */}
          <div className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                        className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-sm font-medium transition-all text-left",
                            tab === id ? "bg-primary-50 text-primary" : "text-text-2 hover:bg-surface-3")}>
                  <Icon size={16} /> {label}
                </button>
            ))}
            <div className="pt-4 border-t border-border">
              <button onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
                <LogOut size={16} /> {t.logout}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="card">

            {/* ── PROFIL ── */}
            {tab === "profile" && (
                <form onSubmit={handleSubmit(onSave)}>
                  <h2 className="text-lg font-bold text-text-1 mb-5">Informations du profil</h2>
                  <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border">
                    <div className="relative">
                      <Avatar user={displayUser} size="lg" />
                      {uploadingAvatar && (
                          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                            <Loader2 size={20} className="animate-spin text-white" />
                          </div>
                      )}
                      <label className={cn("absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white transition-colors",
                          uploadingAvatar ? "cursor-wait opacity-60" : "cursor-pointer hover:bg-primary-700")}>
                        <Camera size={13} />
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                               disabled={uploadingAvatar} onChange={handleAvatarChange} />
                      </label>
                    </div>
                    <div>
                      <p className="font-semibold text-text-1">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-text-3 mt-0.5">JPG, PNG, WebP — max 5 MB</p>
                      {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
                      {avatarPreview && !uploadingAvatar && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Check size={10} /> Photo mise à jour !
                          </p>
                      )}
                    </div>
                  </div>

                  {saveError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-[10px] text-sm">{saveError}</div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Prénom</label>
                        <input {...register("firstName")} className="input" />
                        {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                      </div>
                      <div>
                        <label className="label">Nom</label>
                        <input {...register("lastName")} className="input" />
                        {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="label">Bio <span className="text-text-3 font-normal">(optionnel)</span></label>
                      <textarea {...register("bio")} rows={3} placeholder="Parle de toi, tes intérêts, tes projets..." className="input resize-none" />
                      {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Filière</label>
                        <select {...register("department")} className="input">
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Niveau</label>
                        <select {...register("level")} className="input">
                          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">Université</label>
                      <input {...register("university")} className="input" placeholder="Université Mohammed V" />
                    </div>
                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <p className="text-xs text-text-3">Données sauvegardées dans MongoDB</p>
                      <button type="submit" disabled={isSaving || !isDirty}
                              className="btn-primary flex items-center gap-2 disabled:opacity-60">
                        {isSaving && <Loader2 size={14} className="animate-spin" />}
                        {isSaving ? t.saving : t.saveBtn}
                      </button>
                    </div>
                  </div>
                </form>
            )}

            {/* ── NOTIFICATIONS ── */}
            {tab === "notifications" && (
                <div>
                  <h2 className="text-lg font-bold text-text-1 mb-1">Préférences de notifications</h2>
                  <p className="text-xs text-text-3 mb-5">Sauvegardé automatiquement</p>
                  <div className="space-y-1">
                    {([
                      { key: "newFollowers",   label: "Nouveaux abonnés",  desc: "Quand quelqu'un te suit"         },
                      { key: "likes",          label: "Likes",             desc: "Quand quelqu'un aime ton post"   },
                      { key: "comments",       label: "Commentaires",      desc: "Quand quelqu'un commente"        },
                      { key: "mentions",       label: "Mentions",          desc: "Quand tu es mentionné"           },
                      { key: "directMessages", label: "Messages directs",  desc: "Nouveaux messages reçus"         },
                      { key: "weeklyDigest",   label: "Emails de résumé",  desc: "Résumé hebdomadaire par email"   },
                    ] as { key: keyof typeof notifPrefs; label: string; desc: string }[]).map(item => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-text-1">{item.label}</p>
                            <p className="text-xs text-text-3 mt-0.5">{item.desc}</p>
                          </div>
                          {/* Toggle contrôlé par Redux — valeur réelle depuis MongoDB */}
                          <button
                              onClick={() => toggleNotif(item.key)}
                              className={cn(
                                  "relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0",
                                  notifPrefs[item.key] ? "bg-primary" : "bg-surface-3"
                              )}
                          >
                      <span className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
                          notifPrefs[item.key] ? "left-5" : "left-0.5"
                      )} />
                          </button>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {/* ── CONFIDENTIALITÉ ── */}
            {tab === "privacy" && (
                <div>
                  <h2 className="text-lg font-bold text-text-1 mb-1">Confidentialité & Sécurité</h2>
                  <p className="text-xs text-text-3 mb-5">Sauvegardé automatiquement</p>
                  <div className="space-y-1">
                    {([
                      { key: "privateAccount", label: "Compte privé",                 desc: "Seuls tes abonnés voient tes posts"    },
                      { key: "showEmail",      label: "Afficher l'email",             desc: "Visible sur ton profil public"         },
                      { key: "allowMessages",  label: "Autoriser les messages",       desc: "Tous peuvent t'écrire"                 },
                      { key: "appearInSearch", label: "Apparaître dans la recherche", desc: "Retrouvable par les autres étudiants"  },
                    ] as { key: keyof typeof privacySettings; label: string; desc: string }[]).map(item => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-text-1">{item.label}</p>
                            <p className="text-xs text-text-3 mt-0.5">{item.desc}</p>
                          </div>
                          <button
                              onClick={() => togglePrivacy(item.key)}
                              className={cn(
                                  "relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0",
                                  privacySettings[item.key] ? "bg-primary" : "bg-surface-3"
                              )}
                          >
                      <span className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
                          privacySettings[item.key] ? "left-5" : "left-0.5"
                      )} />
                          </button>
                        </div>
                    ))}

                    {/* Zone dangereuse */}
                    <div className="pt-5 mt-2">
                      <p className="text-sm font-semibold text-red-500 mb-1">Zone dangereuse</p>
                      <p className="text-xs text-text-3 mb-3">La suppression est irréversible et efface toutes vos données.</p>
                      {!showDeleteConfirm ? (
                          <button onClick={() => setShowDeleteConfirm(true)}
                                  className="flex items-center gap-2 bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-[10px] hover:bg-red-600 transition-colors">
                            <Trash2 size={14} /> Supprimer mon compte
                          </button>
                      ) : (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-[10px]">
                            <p className="text-sm font-semibold text-red-700 mb-3">Confirmer la suppression ?</p>
                            <div className="flex gap-3">
                              <button onClick={handleDeleteAccount} disabled={deletingAccount}
                                      className="flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-[10px] hover:bg-red-700 disabled:opacity-60 transition-colors">
                                {deletingAccount && <Loader2 size={12} className="animate-spin" />}
                                Oui, supprimer
                              </button>
                              <button onClick={() => setShowDeleteConfirm(false)}
                                      className="text-sm font-medium text-text-2 px-4 py-2 rounded-[10px] hover:bg-surface-3 transition-colors">
                                Annuler
                              </button>
                            </div>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
            )}

            {/* ── APPARENCE ── */}
            {tab === "appearance" && (
                <div>
                  <h2 className="text-lg font-bold text-text-1 mb-1">Apparence</h2>
                  <p className="text-xs text-text-3 mb-5">Les changements sont appliqués immédiatement</p>
                  <div className="space-y-6">

                    {/* Thème couleur */}
                    <div>
                      <label className="label mb-3 block">Thème de couleur</label>
                      <div className="grid grid-cols-4 gap-3 mt-2">
                        {THEMES.map(({ id, color, label }) => (
                            <button key={id} onClick={() => handleThemeChange(id)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-[10px] border-2 transition-all",
                                        currentTheme === id
                                            ? "border-primary bg-primary-50"
                                            : "border-border hover:border-primary/30"
                                    )}>
                              <div className="w-9 h-9 rounded-full shadow-md" style={{ background: color }} />
                              <span className="text-xs font-medium text-text-2">{label}</span>
                              {currentTheme === id && (
                                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: color }}>
                                    <Check size={10} className="text-white" />
                                  </div>
                              )}
                            </button>
                        ))}
                      </div>
                    </div>

                    {/* Langue */}
                    <div>
                      <label className="label block mb-2">Langue de l'interface</label>
                      <div className="space-y-2 mt-1">
                        {LANGUAGES.map(({ value, label }) => (
                            <button key={value} onClick={() => handleLanguageChange(value)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-[10px] border-2 text-sm font-medium transition-all",
                                        currentLanguage === value
                                            ? "border-primary bg-primary-50 text-primary"
                                            : "border-border text-text-2 hover:border-primary/30"
                                    )}>
                              <span>{label}</span>
                              {currentLanguage === value && <Check size={14} />}
                            </button>
                        ))}
                      </div>
                      {currentLanguage === "ar" && (
                          <p className="text-xs text-amber-600 mt-2 p-2 bg-amber-50 rounded-[8px]">
                            ⚠️ Le mode RTL est activé. Rechargez la page pour un affichage optimal.
                          </p>
                      )}
                    </div>

                  </div>
                </div>
            )}

          </div>
        </div>
      </div>
  );
}