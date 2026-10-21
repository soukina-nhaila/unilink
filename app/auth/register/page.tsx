"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { registerUser, clearError } from "@/store/slices/authSlice";

const DEPARTMENTS = ["Informatique","IA & Big Data","Génie Civil","Économie & Gestion","Réseaux & Télécoms","Mathématiques","Physique","Chimie","Biologie","Droit","Médecine","Architecture"];
const LEVELS = ["L1","L2","L3","M1","M2","Doctorat"];

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", password:"", confirmPassword:"", department:"", level:"" });
  const [errors, setErrors] = useState<Record<string,string>>({});

  useEffect(() => {
    if (isAuthenticated) router.replace("/feed");
    return () => { dispatch(clearError()); };
  }, [isAuthenticated]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    const e: Record<string,string> = {};
    if (!form.firstName || form.firstName.length < 2) e.firstName = "Prénom requis (min. 2 car.)";
    if (!form.lastName || form.lastName.length < 2) e.lastName = "Nom requis (min. 2 car.)";
    if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email = "Email invalide";
    if (form.password.length < 8) e.password = "Min. 8 caractères";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string,string> = {};
    if (!form.department) e.department = "Filière requise";
    if (!form.level) e.level = "Niveau requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { if (validateStep1()) setStep(2); return; }
    if (!validateStep2()) return;
    const { confirmPassword: _, ...data } = form;
    dispatch(registerUser(data));
  };

  return (
    <div className="card p-7">
      {/* Steps */}
      <div className="flex items-center gap-2 mb-6">
        {[1,2].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
              style={{ background: step > s ? "#34D399" : step === s ? "#6C4FF6" : "#E8E5FF", color: step >= s ? "#fff" : "#A09DBF" }}>
              {step > s ? <Check size={12}/> : s}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: step >= s ? "#1A1333" : "#A09DBF" }}>
                {s === 1 ? "Compte" : "Profil académique"}
              </p>
            </div>
            {i === 0 && <div className="w-8 h-px mx-1" style={{ background: step > 1 ? "#6C4FF6" : "#E8E5FF" }} />}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-1" style={{ color: "#1A1333" }}>
        {step === 1 ? "Rejoins UniLink 🎓" : "Ton parcours académique"}
      </h2>
      <p className="text-sm mb-5" style={{ color: "#6B6885" }}>
        {step === 1 ? "Crée ton profil étudiant en quelques secondes" : "Dernière étape !"}
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
          <AlertCircle size={15}/>{error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[{k:"firstName",p:"Karim",l:"Prénom"},{k:"lastName",p:"Alaoui",l:"Nom"}].map(({k,p,l}) => (
                <div key={k}>
                  <label className="label">{l}</label>
                  <input value={form[k as keyof typeof form]} onChange={e=>set(k,e.target.value)} placeholder={p} className="input"/>
                  {errors[k] && <p className="text-xs mt-1" style={{color:"#EF4444"}}>{errors[k]}</p>}
                </div>
              ))}
            </div>
            <div>
              <label className="label">Email universitaire</label>
              <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="prenom.nom@uni.ma" className="input"/>
              {errors.email && <p className="text-xs mt-1" style={{color:"#EF4444"}}>{errors.email}</p>}
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input type={showPwd?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Min. 8 caractères" className="input pr-10"/>
                <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:"#A09DBF"}}>
                  {showPwd?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{color:"#EF4444"}}>{errors.password}</p>}
            </div>
            <div>
              <label className="label">Confirmer le mot de passe</label>
              <input type="password" value={form.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)} placeholder="••••••••" className="input"/>
              {errors.confirmPassword && <p className="text-xs mt-1" style={{color:"#EF4444"}}>{errors.confirmPassword}</p>}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="label">Filière / Département</label>
              <select value={form.department} onChange={e=>set("department",e.target.value)} className="input">
                <option value="">Sélectionner une filière...</option>
                {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="text-xs mt-1" style={{color:"#EF4444"}}>{errors.department}</p>}
            </div>
            <div>
              <label className="label">Niveau d'études</label>
              <div className="grid grid-cols-6 gap-2">
                {LEVELS.map(l=>(
                  <button key={l} type="button" onClick={()=>set("level",l)}
                    className="py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: form.level===l ? "#6C4FF6" : "#F8F7FF",
                      color: form.level===l ? "#fff" : "#6B6885",
                      border: `1px solid ${form.level===l ? "#6C4FF6" : "#E8E5FF"}`
                    }}>
                    {l}
                  </button>
                ))}
              </div>
              {errors.level && <p className="text-xs mt-1" style={{color:"#EF4444"}}>{errors.level}</p>}
            </div>
          </>
        )}

        <div className="flex gap-2 pt-1">
          {step === 2 && (
            <button type="button" onClick={()=>setStep(1)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{border:"1px solid #E8E5FF",color:"#6B6885",background:"#fff"}}>
              ← Retour
            </button>
          )}
          <button type="submit" disabled={isLoading} className="btn-primary flex-1 gap-2">
            {isLoading && <Loader2 size={14} className="animate-spin"/>}
            {step === 1 ? "Continuer →" : isLoading ? "Inscription..." : "Créer mon compte 🎉"}
          </button>
        </div>
      </form>

      <p className="text-center text-sm mt-5" style={{color:"#6B6885"}}>
        Déjà inscrit ?{" "}
        <Link href="/auth/login" className="font-semibold hover:underline" style={{color:"#6C4FF6"}}>Se connecter</Link>
      </p>
    </div>
  );
}
