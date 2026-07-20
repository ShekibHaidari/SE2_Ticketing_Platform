import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Film, Ticket, ShieldCheck, LayoutDashboard, Mail, Lock, User as UserIcon, Eye, EyeOff, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "ورود / ثبت‌نام — سینما‌بلیت" },
      { name: "description", content: "ورود به حساب کاربری یا ایجاد حساب جدید برای خرید بلیت سینما." },
    ],
  }),
  component: LoginPage,
});

const demos = [
  { role: "خریدار", email: "customer@example.com", icon: <Ticket className="size-4" />, tone: "text-primary bg-primary/10 border-primary/30" },
  { role: "مدیر سینما", email: "manager@example.com", icon: <LayoutDashboard className="size-4" />, tone: "text-warning bg-warning/10 border-warning/30" },
  { role: "کارمند گیشه", email: "staff@example.com", icon: <ShieldCheck className="size-4" />, tone: "text-success bg-success/10 border-success/30" },
  { role: "مدیر سیستم", email: "admin@example.com", icon: <ShieldCheck className="size-4" />, tone: "text-destructive bg-destructive/10 border-destructive/30" },
];

function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("customer@example.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectByRole = (role: string) => {
    if (role === "manager") navigate({ to: "/manager" });
    else if (role === "staff") navigate({ to: "/staff" });
    else if (role === "admin") navigate({ to: "/admin" });
    else navigate({ to: "/" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    if (mode === "login") {
      try {
        const user = await login(email, password);
        toast.success(`خوش آمدید، ${user.name}`);
        redirectByRole(user.role);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "ورود ناموفق بود");
      } finally {
        setLoading(false);
      }
    } else {
      if (!name.trim()) { setLoading(false); toast.error("نام را وارد کنید"); return; }
      try {
        await register(email, password, name);
        toast.success("حساب شما با موفقیت ساخته شد");
        navigate({ to: "/" });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "ثبت‌نام ناموفق بود");
      } finally {
        setLoading(false);
      }
    }
  };

  const selectDemo = (d: typeof demos[number]) => {
    setMode("login");
    setEmail(d.email);
    setPassword("password123");
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-2">
        {/* Right side (RTL first) — Marketing panel */}
        <div className="relative hidden lg:flex items-center justify-center p-10 bg-gradient-to-bl from-primary/20 via-accent/30 to-background overflow-hidden order-2 lg:order-1">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
              <Sparkles className="size-3" /> رزرو بلیت ساده و مطمئن
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              تجربه‌ی سینما،<br />
              فقط با چند کلیک.
            </h2>
            <p className="text-muted-foreground leading-loose">
              بهترین فیلم‌های روز را ببینید، صندلی دلخواه خود را انتخاب کنید و بلیت الکترونیکی را روی گوشی خود دریافت کنید.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <FeatureCell icon={<Film className="size-4" />} title="ده‌ها فیلم" desc="در اکران" />
              <FeatureCell icon={<Ticket className="size-4" />} title="بلیت QR" desc="روی گوشی شما" />
              <FeatureCell icon={<Lock className="size-4" />} title="پرداخت امن" desc="درگاه شاپرک" />
              <FeatureCell icon={<ShieldCheck className="size-4" />} title="پشتیبانی" desc="۲۴ ساعته" />
            </div>
          </div>
        </div>

        {/* Left side — Form */}
        <div className="flex items-center justify-center p-6 order-1 lg:order-2">
          <div className="w-full max-w-md space-y-6">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl mb-6">
                <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground">
                  <Film className="size-5" />
                </div>
                سینما‌بلیت
              </Link>
              <h1 className="text-2xl font-bold">
                {mode === "login" ? "ورود به حساب" : "ایجاد حساب جدید"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login"
                  ? "برای خرید بلیت و دسترسی به پنل کاربری وارد شوید."
                  : "با ثبت‌نام، خرید بلیت را در چند ثانیه شروع کنید."}
              </p>
            </div>

            {/* Mode switcher */}
            <div className="flex p-1 rounded-lg bg-muted">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2 text-sm rounded-md transition ${mode === "login" ? "bg-background shadow font-semibold" : "text-muted-foreground"}`}
              >
                ورود
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-2 text-sm rounded-md transition ${mode === "register" ? "bg-background shadow font-semibold" : "text-muted-foreground"}`}
              >
                ثبت‌نام
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <Label className="mb-1.5 block text-xs">نام و نام خانوادگی</Label>
                  <div className="relative">
                    <UserIcon className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={name} onChange={e => setName(e.target.value)} className="pr-9" placeholder="مثلاً علی احمدی" />
                  </div>
                </div>
              )}
              <div>
                <Label className="mb-1.5 block text-xs">ایمیل</Label>
                <div className="relative">
                  <Mail className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input dir="ltr" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pr-9" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Label className="text-xs">رمز عبور</Label>
                  {mode === "login" && (
                    <button type="button" className="text-[11px] text-primary hover:underline" onClick={() => toast.info("در نسخه‌ی آزمایشی فعال نیست")}>
                      فراموشی رمز؟
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    dir="ltr"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pr-9 pl-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="نمایش رمز"
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "لطفاً صبر کنید..." : mode === "login" ? "ورود به حساب" : "ساخت حساب"}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="border border-dashed border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">کاربران نمونه</div>
                <span className="text-[11px] text-muted-foreground">رمز: <span dir="ltr" className="font-mono">password123</span></span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demos.map(d => (
                  <button
                    key={d.email}
                    onClick={() => selectDemo(d)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-right text-xs transition hover:scale-[1.02] ${d.tone}`}
                  >
                    <span className="shrink-0">{d.icon}</span>
                    <div className="min-w-0">
                      <div className="font-medium">{d.role}</div>
                      <div dir="ltr" className="text-[10px] opacity-70 truncate">{d.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FeatureCell({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-card/60 backdrop-blur border border-border p-3">
      <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-2">{icon}</div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
