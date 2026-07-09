import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDB } from "./index";
import { toFa, formatTime, money } from "@/lib/format";
import { Clock, MapPin, Calendar, Ticket, Film } from "lucide-react";

export const Route = createFileRoute("/movies/$id")({
  component: MovieDetail,
});

const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];
const MONTHS_FA = ["ژانویه","فوریه","مارس","آوریل","مه","ژوئن","ژوئیه","اوت","سپتامبر","اکتبر","نوامبر","دسامبر"];

function shortDate(iso: string) {
  const d = new Date(iso);
  return { wd: WEEKDAYS[d.getDay()], day: toFa(d.getDate()), mo: MONTHS_FA[d.getMonth()] };
}

function MovieDetail() {
  const { id } = Route.useParams();
  const data = useDB();
  const navigate = useNavigate();
  const movie = data.movies.find(m => m.id === id);

  const showtimes = useMemo(() =>
    data.showtimes
      .filter(s => s.movieId === id && new Date(s.startsAt).getTime() > Date.now())
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  [data, id]);

  const days = useMemo(() => Array.from(new Set(showtimes.map(s => s.startsAt.slice(0, 10)))), [showtimes]);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const selectedDay = activeDay ?? days[0] ?? null;

  const byCinema = useMemo(() => {
    if (!selectedDay) return [] as { cinemaId: string; list: typeof showtimes }[];
    const list = showtimes.filter(s => s.startsAt.slice(0, 10) === selectedDay);
    const map = new Map<string, typeof showtimes>();
    for (const s of list) {
      if (!map.has(s.cinemaId)) map.set(s.cinemaId, []);
      map.get(s.cinemaId)!.push(s);
    }
    return Array.from(map.entries()).map(([cinemaId, l]) => ({ cinemaId, list: l }));
  }, [showtimes, selectedDay]);

  if (!movie) return <Layout><div className="text-center py-20">فیلم یافت نشد.</div></Layout>;

  return (
    <Layout>
      {/* Hero backdrop */}
      <div className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0">
          <img src={movie.posterUrl} alt="" className="w-full h-full object-cover blur-2xl opacity-30 scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-2xl ring-1 ring-border">
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Film className="size-4" /> در حال اکران
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{movie.title}</h1>
              {movie.originalTitle && (
                <p className="text-muted-foreground text-sm" dir="ltr">{movie.originalTitle}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{movie.genre}</Badge>
              <Badge variant="outline"><Clock className="size-3 ml-1" /> {toFa(movie.duration)} دقیقه</Badge>
              <Badge variant="outline">رده سنی: {movie.rating}</Badge>
              <Badge variant="outline"><Ticket className="size-3 ml-1" /> {toFa(showtimes.length)} سانس فعال</Badge>
            </div>
            <p className="leading-loose text-muted-foreground max-w-2xl">{movie.description}</p>

            {selectedDay && (
              <Button size="lg" onClick={() => {
                const st = showtimes.find(s => s.startsAt.slice(0, 10) === selectedDay);
                if (st) navigate({ to: "/showtimes/$id", params: { id: st.id } });
              }}>
                خرید بلیت
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Showtimes */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="size-5 text-primary" />
          <h2 className="text-2xl font-bold">سانس‌ها</h2>
        </div>

        {days.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
            در حال حاضر سانسی برای این فیلم موجود نیست.
          </div>
        ) : (
          <>
            {/* Day pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-1 px-1">
              {days.map(day => {
                const info = shortDate(day + "T00:00:00");
                const isActive = day === selectedDay;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`shrink-0 rounded-xl px-4 py-3 border transition text-center min-w-[92px] ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card border-border hover:border-primary/60"
                    }`}
                  >
                    <div className="text-xs opacity-80">{info.wd}</div>
                    <div className="text-xl font-bold leading-tight">{info.day}</div>
                    <div className="text-xs opacity-80">{info.mo}</div>
                  </button>
                );
              })}
            </div>

            {/* Cinema groups */}
            <div className="space-y-4">
              {byCinema.map(({ cinemaId, list }) => {
                const cinema = data.cinemas.find(c => c.id === cinemaId);
                return (
                  <div key={cinemaId} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="size-4 text-primary" />
                      <div className="font-semibold">{cinema?.name}</div>
                      <span className="text-xs text-muted-foreground">— {cinema?.city}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">{cinema?.address}</div>
                    <div className="flex flex-wrap gap-2">
                      {list.map(st => {
                        const hall = data.halls.find(h => h.id === st.hallId);
                        return (
                          <button
                            key={st.id}
                            onClick={() => navigate({ to: "/showtimes/$id", params: { id: st.id } })}
                            className="group text-right px-4 py-2 rounded-lg border border-border hover:border-primary hover:bg-accent transition"
                          >
                            <div className="font-bold text-lg leading-tight group-hover:text-primary">
                              {formatTime(st.startsAt)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{hall?.name}</div>
                            <div className="text-[11px] text-primary mt-0.5">{money(st.price)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
