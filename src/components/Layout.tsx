import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useAuth, roleLabel } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Film, Ticket, LayoutDashboard, ShieldCheck, User as UserIcon, Menu, X, Home } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashPath =
    user?.role === "manager" ? "/manager" :
    user?.role === "staff" ? "/staff" :
    user?.role === "admin" ? "/admin" : "/my-tickets";
  const dashLabel =
    user?.role === "manager" ? "داشبورد مدیر" :
    user?.role === "staff" ? "کنترل بلیت" :
    user?.role === "admin" ? "مدیریت سیستم" : "بلیت‌های من";
  const dashIcon =
    user?.role === "staff" ? <ShieldCheck className="size-4" /> :
    user?.role === "admin" ? <ShieldCheck className="size-4" /> :
    user?.role === "manager" ? <LayoutDashboard className="size-4" /> :
    <Ticket className="size-4" />;

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0" onClick={closeMenu}>
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground">
              <Film className="size-4" />
            </div>
            <span>سینما‌بلیت</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            <NavLink to="/" exact>خانه</NavLink>
            <NavLink to="/movies">فیلم‌ها</NavLink>
            {user && <NavLink to={dashPath}>{dashLabel}</NavLink>}
          </nav>

          <div className="mr-auto flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-accent/50 border border-border">
                  <div className="size-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    {user.name.slice(0, 1)}
                  </div>
                  <div className="text-xs leading-tight">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-muted-foreground text-[10px] flex items-center gap-0.5">{dashIcon}{roleLabel[user.role]}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { logout(); navigate({ to: "/" }); }} className="hidden md:inline-flex">
                  <LogOut className="size-4 ml-1" /> خروج
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate({ to: "/login" })}>
                <LogIn className="size-4 ml-1" /> ورود
              </Button>
            )}

            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMenuOpen(v => !v)} aria-label="منو">
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card animate-in slide-in-from-top-1">
            <nav className="max-w-7xl mx-auto px-4 py-2 flex flex-col">
              <MobileLink to="/" icon={<Home className="size-4" />} onClick={closeMenu} exact>خانه</MobileLink>
              <MobileLink to="/movies" icon={<Film className="size-4" />} onClick={closeMenu}>فیلم‌ها</MobileLink>
              {user && <MobileLink to={dashPath} icon={dashIcon} onClick={closeMenu}>{dashLabel}</MobileLink>}
              {user && (
                <button
                  onClick={() => { logout(); closeMenu(); navigate({ to: "/" }); }}
                  className="flex items-center gap-2 px-3 py-3 border-t border-border text-destructive text-sm mt-1"
                >
                  <LogOut className="size-4" /> خروج از حساب
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 font-bold mb-2">
              <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground">
                <Film className="size-4" />
              </div>
              سینما‌بلیت
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              پلتفرم رزرو آنلاین بلیت سینما با تجربه‌ای ساده، سریع و امن.
            </p>
          </div>
          <div>
            <div className="font-semibold mb-2">دسترسی سریع</div>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li><Link to="/" className="hover:text-primary">صفحه اصلی</Link></li>
              <li><Link to="/movies" className="hover:text-primary">فیلم‌های در حال اکران</Link></li>
              <li><Link to="/my-tickets" className="hover:text-primary">بلیت‌های من</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">درباره</div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              پروژه‌ی درس مهندسی نرم‌افزار ۲
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed mt-2">
              تهیه و توسعه:
              {" "}احمدشکیب حیدری
              {" "}و مصطفی صادفی
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} سینما‌بلیت — همه‌ی حقوق محفوظ است.
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, children, exact }: { to: string; children: ReactNode; exact?: boolean }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-md hover:bg-accent transition text-muted-foreground hover:text-foreground"
      activeProps={{ className: "px-3 py-2 rounded-md bg-primary/10 text-primary font-medium" }}
      activeOptions={{ exact: !!exact }}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, icon, children, onClick, exact }: { to: string; icon: ReactNode; children: ReactNode; onClick: () => void; exact?: boolean }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-md text-sm hover:bg-accent"
      activeProps={{ className: "flex items-center gap-3 px-3 py-3 rounded-md text-sm bg-primary/10 text-primary font-medium" }}
      activeOptions={{ exact: !!exact }}
    >
      {icon}{children}
    </Link>
  );
}

export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4 px-4">
        <div className="size-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <UserIcon className="size-8 text-muted-foreground" />
        </div>
        <div>
          <div className="font-semibold text-lg">ابتدا وارد شوید</div>
          <p className="text-muted-foreground text-sm mt-1">برای مشاهده‌ی این صفحه به حساب کاربری خود نیاز دارید.</p>
        </div>
        <Button onClick={() => navigate({ to: "/login" })}>ورود به حساب</Button>
      </div>
    );
  }
  if (!roles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-3 px-4">
        <div className="size-16 mx-auto rounded-full bg-destructive/15 flex items-center justify-center">
          <ShieldCheck className="size-8 text-destructive" />
        </div>
        <p className="font-semibold text-lg">دسترسی مجاز نیست</p>
        <p className="text-sm text-muted-foreground">این بخش مخصوص نقش‌های خاصی است. نقش شما: <span className="font-medium text-foreground">{roleLabel[user.role]}</span></p>
      </div>
    );
  }
  return <>{children}</>;
}
