import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, refreshDB, type Role, type User } from "./store";

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<User>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([api<{ user: User | null }>("/auth/me"), refreshDB()])
      .then(([session]) => setUser(session.user))
      .catch(error => console.error("Unable to initialize application session", error))
      .finally(() => setReady(true));
  }, []);

  const login: AuthCtx["login"] = async (email, password) => {
    const { user } = await api<{ user: User }>("/auth/login", { method: "POST", body: { email, password } });
    setUser(user);
    await refreshDB();
    return user;
  };

  const logout = async () => {
    await api<void>("/auth/logout", { method: "POST" });
    setUser(null);
    await refreshDB();
  };

  const register: AuthCtx["register"] = async (email, password, name) => {
    const { user } = await api<{ user: User }>("/auth/register", { method: "POST", body: { email, password, name } });
    setUser(user);
    await refreshDB();
    return user;
  };

  if (!ready) return null;
  return <Ctx.Provider value={{ user, login, logout, register }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const context = useContext(Ctx);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export const roleLabel: Record<Role, string> = {
  customer: "خریدار", manager: "مدیر سینما", staff: "کارمند گیشه", admin: "مدیر سیستم",
};
