import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layout, RequireRole } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDB } from "./index";
import { useAuth } from "@/lib/auth";
import { validateTicket } from "@/lib/store";
import type { Ticket, Showtime, Movie, Cinema, Hall } from "@/lib/store";
import { formatDateTime, formatTime, toFa } from "@/lib/format";
import { CheckCircle2, XCircle, Search, ScanLine, Armchair, Film, MapPin, Clock, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/staff")({
  component: StaffPage,
});

type Result =
  | { kind: "ok"; ticket: Ticket; movie?: Movie; showtime?: Showtime; cinema?: Cinema; hall?: Hall }
  | { kind: "err"; error: string; ticket?: Ticket }
  | null;

function StaffPage() {
  const data = useDB();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [result]);

  const validated = useMemo(
    () => data.tickets.filter(t => t.usedBy === user?.id).slice(-8).reverse(),
    [data.tickets, user]
  );

  const totalToday = useMemo(() => {
    const today = new Date().toDateString();
    return data.tickets.filter(t => t.usedBy === user?.id && t.usedAt && new Date(t.usedAt).toDateString() === today).length;
  }, [data.tickets, user]);

  const doValidate = () => {
    if (!code.trim() || !user) return;
    const res = validateTicket(code, user.id);
    if (res.error) { setResult({ kind: "err", error: res.error, ticket: res.ticket }); setCode(""); return; }
    const t = res.ticket!;
    const showtime = data.showtimes.find(s => s.id === t.showtimeId);
    const movie = showtime ? data.movies.find(m => m.id === showtime.movieId) : undefined;
    const cinema = showtime ? data.cinemas.find(c => c.id === showtime.cinemaId) : undefined;
    const hall = showtime ? data.halls.find(h => h.id === showtime.hallId) : undefined;
    setResult({ kind: "ok", ticket: t, movie, showtime, cinema, hall });
    setSessionCount(c => c + 1);
    setCode("");
  };

  const reset = () => { setResult(null); setCode(""); inputRef.current?.focus(); };

  return (
    <Layout>
      <RequireRole roles={["staff", "admin"]}>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ScanLine className="size-4" /> کنترل ورودی
              </div>
              <h1 className="text-3xl font-bold mt-1">اسکن و اعتبارسنجی بلیت</h1>
              <p className="text-sm text-muted-foreground mt-1">کد بلیت مشتری را وارد کنید یا با کیبورد اسکنر QR بخوانید.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="این نشست" value={toFa(sessionCount)} tone="primary" />
              <MiniStat label="امروز" value={toFa(totalToday)} />
            </div>
          </div>

          {/* Scanner input */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <ScanLine className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-primary" />
                <Input
                  ref={inputRef}
                  dir="ltr"
                  placeholder="TKT-XXXXXXXX"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && doValidate()}
                  className="font-mono text-lg pr-9 h-12 text-center tracking-widest"
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <Button size="lg" onClick={doValidate} className="h-12"><Search className="size-4 ml-1" /> اعتبارسنجی</Button>
              {result && <Button size="lg" variant="outline" onClick={reset} className="h-12"><RefreshCw className="size-4 ml-1" /> اسکن جدید</Button>}
            </div>
          </div>

          {/* Result panel */}
          {result?.kind === "ok" && (
            <div className="rounded-2xl border-2 border-success bg-success/5 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-success/15 p-4 flex items-center gap-3">
                <div className="size-12 rounded-full bg-success text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-7" />
                </div>
                <div>
                  <div className="text-xl font-bold text-success">بلیت معتبر است</div>
                  <div className="text-xs text-muted-foreground">مسافر می‌تواند وارد سالن شود.</div>
                </div>
                <Badge className="bg-success text-white mr-auto">تأیید شد</Badge>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={<Film className="size-4" />} label="فیلم" value={result.movie?.title || "—"} />
                <InfoRow icon={<Clock className="size-4" />} label="سانس" value={result.showtime ? formatTime(result.showtime.startsAt) : "—"} />
                <InfoRow icon={<MapPin className="size-4" />} label="سالن" value={`${result.cinema?.name || ""} — ${result.hall?.name || ""}`} />
                <InfoRow icon={<Armchair className="size-4" />} label="صندلی‌ها" value={result.ticket.seats.join("، ")} />
                <div className="md:col-span-2 border-t border-border pt-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>کد بلیت: <span dir="ltr" className="font-mono text-foreground">{result.ticket.code}</span></span>
                  <span>تعداد: {toFa(result.ticket.seats.length)}</span>
                </div>
              </div>
            </div>
          )}

          {result?.kind === "err" && (
            <div className="rounded-2xl border-2 border-destructive bg-destructive/5 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-destructive/15 p-4 flex items-center gap-3">
                <div className="size-12 rounded-full bg-destructive text-white flex items-center justify-center shrink-0">
                  <XCircle className="size-7" />
                </div>
                <div>
                  <div className="text-xl font-bold text-destructive">اجازه ورود ندهید</div>
                  <div className="text-sm text-muted-foreground">{result.error}</div>
                </div>
              </div>
              {result.ticket && (
                <div className="p-5 space-y-2 text-sm">
                  <div className="text-muted-foreground">اطلاعات بلیت اسکن شده:</div>
                  <div>کد: <span dir="ltr" className="font-mono">{result.ticket.code}</span></div>
                  {result.ticket.usedAt && <div>استفاده‌ی قبلی: {formatDateTime(result.ticket.usedAt)}</div>}
                </div>
              )}
            </div>
          )}

          {/* Recent */}
          <div className="rounded-2xl border border-border bg-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="font-semibold">آخرین بلیت‌های تأیید شده</div>
              <Badge variant="secondary">{toFa(validated.length)}</Badge>
            </div>
            <div className="divide-y divide-border">
              {validated.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">هنوز بلیتی کنترل نکرده‌اید.</div>
              )}
              {validated.map(t => {
                const st = data.showtimes.find(s => s.id === t.showtimeId);
                const m = st ? data.movies.find(x => x.id === st.movieId) : null;
                return (
                  <div key={t.id} className="p-3 flex items-center gap-3 text-sm">
                    <div className="size-9 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{m?.title}</div>
                      <div className="text-xs text-muted-foreground">صندلی: {t.seats.join("، ")}</div>
                    </div>
                    <div className="text-left">
                      <div dir="ltr" className="font-mono text-xs">{t.code}</div>
                      {t.usedAt && <div className="text-[11px] text-muted-foreground">{formatTime(t.usedAt)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </RequireRole>
    </Layout>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div className={`rounded-xl border border-border px-4 py-2 text-center ${tone === "primary" ? "bg-primary/10 border-primary/40" : "bg-card"}`}>
      <div className={`text-xl font-bold leading-tight ${tone === "primary" ? "text-primary" : ""}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-0.5">{icon}{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
