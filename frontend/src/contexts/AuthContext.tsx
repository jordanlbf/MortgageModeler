"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { subscribeAccessToken } from "@/lib/auth-token";
import {
  bootstrapSession,
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  type MeResponse,
} from "@/lib/platform-api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  user: MeResponse | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    void (async () => {
      const me = await bootstrapSession();
      if (me) {
        setUser(me);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("anonymous");
      }
    })();
  }, []);

  useEffect(() => {
    return subscribeAccessToken((token) => {
      if (token !== null) return;
      setUser(null);
      setStatus((prev) => (prev === "loading" ? prev : "anonymous"));
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password);
    const me = await getMe();
    setUser(me);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await apiRegister(email, password);
    await apiLogin(email, password);
    const me = await getMe();
    setUser(me);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
