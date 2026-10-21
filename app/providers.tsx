"use client";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchCurrentUser } from "@/store/slices/authSlice";
import { fetchNotifications } from "@/store/slices/notificationsSlice";

// Couleurs par thème
const THEME_COLORS: Record<string, string> = {
  violet: "#6C4FF6",
  blue:   "#2563EB",
  green:  "#059669",
  pink:   "#DB2777",
};

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);

  // Charger la session au démarrage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("unilink_token");
      if (token) {
        dispatch(fetchCurrentUser());
        dispatch(fetchNotifications());
      }
    }
  }, [dispatch]);

  // Appliquer le thème CSS dès que user est chargé
  useEffect(() => {
    if (!user) return;
    const color = THEME_COLORS[user.theme || "violet"] || THEME_COLORS.violet;
    document.documentElement.style.setProperty("--primary", color);

    // Générer les variantes claires automatiquement
    document.documentElement.style.setProperty(
        "--primary-light",
        color + "22" // transparence 13%
    );
  }, [user?.theme]);

  // Appliquer la langue
  useEffect(() => {
    if (!user?.language) return;
    document.documentElement.setAttribute("lang", user.language);
  }, [user?.language]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <Provider store={store}>
        <AppInitializer>{children}</AppInitializer>
      </Provider>
  );
}