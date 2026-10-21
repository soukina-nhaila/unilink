import { Sidebar } from "@/components/layout/Sidebar";
import { RightPanel } from "@/components/layout/RightPanel";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F7FF" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "240px 1fr 280px", gap: "0", minHeight: "100vh" }}>
        {/* Sidebar */}
        <div style={{ position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <Sidebar />
        </div>
        {/* Main content */}
        <main style={{ minHeight: "100vh", padding: "24px 20px", borderLeft: "1px solid #E8E5FF", borderRight: "1px solid #E8E5FF" }}>
          {children}
        </main>
        {/* Right panel */}
        <div style={{ padding: "24px 16px" }}>
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
