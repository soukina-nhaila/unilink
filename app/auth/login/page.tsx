"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { loginUser, clearError } from "@/store/slices/authSlice";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/feed");
    return () => { dispatch(clearError()); };
  }, [isAuthenticated]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
      <div className="card p-7">
        <h2 className="text-xl font-bold mb-1" style={{ color: "#1A1333" }}>Bon retour </h2>
        <p className="text-sm mb-6" style={{ color: "#6B6885" }}>Connecte-toi à ton réseau universitaire</p>

        {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Adresse e-mail universitaire</label>
            <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@uni.ma" className="input" required
            />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <div className="relative">
              <input
                  type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="input pr-10" required
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#A09DBF" }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: "#6B6885" }}>
              <input type="checkbox" className="rounded accent-[#6C4FF6]" />
              Se souvenir de moi
            </label>
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full gap-2 mt-2">
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            {isLoading ? "Connexion..." : "Se connecter →"}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: "#6B6885" }}>
          Vous n'avez pas de compte ?{" "}
          <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: "#6C4FF6" }}>
            S'inscrire
          </Link>
        </p>
      </div>
  );
}