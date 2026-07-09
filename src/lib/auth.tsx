import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { db, type Role, type User } from "./store";

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string; user?: User };
  logout: () => void;
  register: (email: string, password: string, name: string) => { ok: boolean; error?: string };
}

const Ctx = createContext<AuthCtx | null>(null);
const SESSION_KEY = "cinema_session_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const uid = localStorage.getItem(SESSION_KEY);
      if (uid) {
        const u = db.get().users.find(x => x.id === uid) || null;
        setUser(u);
      }
    } catch {}
    setReady(true);
    const onStorage = () => {
      const uid = localStorage.getItem(SESSION_KEY);
      setUser(uid ? db.get().users.find(x => x.id === uid) || null : null);
    };
    window.addEventListener("cinema_db_update", onStorage);
    return () => window.removeEventListener("cinema_db_update", onStorage);
  }, []);

  const login: AuthCtx["login"] = (email, password) => {
    const u = db.get().users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
    if (!u) return { ok: false, error: "ایمیل یا رمز عبور نادرست است" };
    localStorage.setItem(SESSION_KEY, u.id);
    setUser(u);
    return { ok: true, user: u };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const register: AuthCtx["register"] = (email, password, name) => {
    const existing = db.get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return { ok: false, error: "این ایمیل قبلاً ثبت شده است" };
    const id = Math.random().toString(36).slice(2, 10);
    db.set(d => {
      d.users.push({ id, email, password, name, role: "customer", createdAt: new Date().toISOString() });
    });
    localStorage.setItem(SESSION_KEY, id);
    setUser(db.get().users.find(u => u.id === id)!);
    return { ok: true };
  };

  if (!ready) return null;
  return <Ctx.Provider value={{ user, login, logout, register }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}

export const roleLabel: Record<Role, string> = {
  customer: "خریدار",
  manager: "مدیر سینما",
  staff: "کارمند گیشه",
  admin: "مدیر سیستم",
};
