import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout, RequireRole } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useDB } from "./index";
import { formatDate, formatTime, money, toFa } from "@/lib/format";
import { Ticket as TicketIcon, MapPin, Clock, QrCode } from "lucide-react";

export const Route = createFileRoute("/my-tickets")({
  component: MyTickets,
});

type Tab = "upcoming" | "past" | "cancelled";

function MyTickets() {
  const { user } = useAuth();
  const data = useDB();
  const [tab, setTab] = useState<Tab>("upcoming");

  const all = useMemo(() => {
    if (!user) return [];
    return data.tickets
      .filter(t => t.userId === user.id)
      .map(t => {
        const st = data.showtimes.find(s => s.id === t.showtimeId);
        return { t, st, movie: st ? data.movies.find(m => m.id === st.movieId) : null, cinema: st ? data.cinemas.find(c => c.id === st.cinemaId) : null, hall: st ? data.halls.find(h => h.id === st.hallId) : null };
      })
      .sort((a, b) => (b.st?.startsAt || "").localeCompare(a.st?.startsAt || ""));
  }, [data, user]);

  const now = Date.now();
  const upcoming = all.filter(x => x.t.status === "valid" && x.st && new Date(x.st.startsAt).getTime() > now);
  const past = all.filter(x => x.t.status === "used" || (x.t.status === "valid" && x.st && new Date(x.st.startsAt).getTime() <= now));
  const cancelled = all.filter(x => x.t.status === "cancelled");

  const shown = tab === "upcoming" ? upcoming : tab === "past" ? past : cancelled;

  return (
    <Layout>
      <RequireRole roles={["customer", "manager", "staff", "admin"]}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">بلیت‌های من</h1>
            <p className="text-muted-foreground text-sm mt-1">مدیریت بلیت‌های خریداری‌شده و مشاهده‌ی کد QR</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="پیش رو" value={upcoming.length} accent="text-primary" />
            <StatCard label="گذشته" value={past.length} />
            <StatCard label="لغوشده" value={cancelled.length} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted mb-5 w-fit">
            <TabBtn active={tab === "upcoming"} onClick={() => setTab("upcoming")}>پیش رو ({toFa(upcoming.length)})</TabBtn>
            <TabBtn active={tab === "past"} onClick={() => setTab("past")}>گذشته ({toFa(past.length)})</TabBtn>
            <TabBtn active={tab === "cancelled"} onClick={() => setTab("cancelled")}>لغوشده ({toFa(cancelled.length)})</TabBtn>
          </div>

          {shown.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
              <TicketIcon className="size-12 mx-auto mb-3 opacity-50" />
              <div className="mb-4">هیچ بلیتی در این بخش نیست.</div>
              <Button asChild variant="outline"><Link to="/movies">مشاهده فیلم‌ها</Link></Button>
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map(({ t, st, movie, cinema, hall }) => (
                <Link
                  key={t.id}
                  to="/tickets/$id"
                  params={{ id: t.id }}
                  className="block rounded-xl border border-border bg-card overflow-hidden hover:border-primary hover:shadow-md transition"
                >
                  <div className="flex gap-4 p-3">
                    <img src={movie?.posterUrl} alt="" className="w-16 md:w-20 h-24 md:h-28 rounded object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{movie?.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="size-3" />{cinema?.name} — {hall?.name}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" />{st && `${formatDate(st.startsAt)} · ${formatTime(st.startsAt)}`}
                          </div>
                        </div>
                        {t.status === "valid" && <Badge className="bg-success text-white shrink-0">معتبر</Badge>}
                        {t.status === "used" && <Badge variant="secondary" className="shrink-0">استفاده شده</Badge>}
                        {t.status === "cancelled" && <Badge variant="destructive" className="shrink-0">لغو شده</Badge>}
                      </div>
                      <div className="border-t border-border/60 mt-3 pt-2 flex items-center justify-between text-xs">
                        <div className="text-muted-foreground">
                          صندلی: <span className="text-foreground font-medium">{t.seats.slice().sort().join("، ")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono" dir="ltr">{t.code}</span>
                          <span className="text-primary font-semibold">{money(t.amount)}</span>
                          <QrCode className="size-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </RequireRole>
    </Layout>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className={`text-2xl font-bold ${accent ?? ""}`}>{toFa(value)}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm rounded-md transition ${
        active ? "bg-background shadow font-semibold" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
