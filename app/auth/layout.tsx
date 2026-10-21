export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F8F7FF 50%, #FCE7F3 100%)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: "linear-gradient(160deg, #6C4FF6 0%, #4C35C4 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">UniLink</span>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Le réseau social<br />de ta vie universitaire
          </h2>
          <p className="text-purple-200 text-lg leading-relaxed mb-8">
            Connecte-toi avec tes camarades, partage tes projets et construis ton réseau professionnel.
          </p>

        </div>

        <p className="text-purple-300 text-xs">© 2026 UniLink — Réseau Social Universitaire</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg" style={{ backgroundColor: "#6C4FF6" }}>
              <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-text-1">UniLink</h1>
            <p className="text-text-3 text-sm mt-1">Réseau Social Universitaire</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
