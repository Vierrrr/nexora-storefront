"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiLogin, apiRegister, apiLogout, AuthUser } from "@/lib/api";

export type { AuthUser as User };

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, phone: string, recaptchaToken?: string) => Promise<boolean>;
  error: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "nexora_customer";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);   // true until we've checked localStorage
  const [error, setError]     = useState("");

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, recaptchaToken?: string): Promise<boolean> => {
    setError("");
    try {
      const u = await apiLogin(email, password, recaptchaToken);
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone: string, recaptchaToken?: string): Promise<boolean> => {
    setError("");
    try {
      const u = await apiRegister(name, email, password, phone, recaptchaToken);
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    if (user) apiLogout(user.id, user.email).catch(() => {});
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, register, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
