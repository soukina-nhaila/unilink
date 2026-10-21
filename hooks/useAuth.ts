"use client";
import { useAppSelector } from "./useAppSelector";
import { useAppDispatch } from "./useAppDispatch";
import { logout } from "@/store/slices/authSlice";
import { authAPI } from "@/lib/api";
import { useRouter } from "next/navigation";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    dispatch(logout());
    router.push("/auth/login");
  };

  return { user, isAuthenticated, isLoading, error, logout: handleLogout };
}
