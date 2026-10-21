import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "UniLink — Réseau Social Étudiant",
  description: "Le réseau social universitaire pour connecter, partager et collaborer avec vos camarades.",
  keywords: ["université", "réseau social", "étudiant", "collaboration", "campus"],
  openGraph: {
    title: "UniLink",
    description: "Le réseau social universitaire",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
