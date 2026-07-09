import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useSyncExternalStore } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, EMPTY_DB } from "@/lib/store";
import { toFa, formatTime as faTime, formatDate as faDateShort } from "@/lib/format";
import {
  Sparkles, Ticket, ShieldCheck, LayoutDashboard,
  Clock, MapPin, Star, PlayCircle, Film, ArrowLeft, Calendar,
} from "lucide-react";

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("cinema_db_update", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("cinema_db_update", cb);
    window.removeEventListener("storage", cb);
  };
}

const getServerSnapshot = () => EMPTY_DB;

export function useDB() {
  return useSyncExternalStore(subscribe, () => db.get(), getServerSnapshot);
}

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const data = useDB();

  const published = useMemo(
    () => data.movies.filter(m => m.published),
    [data.movies]
  );

  const hero = published[0];

  // Movies that have at least one upcoming showtime
  const nowShowing = useMemo(() => {
    const now = Date.now();
    return published
      .map(m => {
        const next = data.showtimes
          .filter(s => s.movieId === m.id && new Date(s.startsAt).getTime() > now)
          .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0];
        return { movie: m, next };
      })
      .filter(x => !!x.next)
      .slice(0, 8);
  }, [published, data.showtimes]);

  // Genres
  const genres = useMemo(() => {
    const set = new Map<string, number>();
    for (const m of published) set.set(m.genre, (set.get(m.genre) ?? 0) + 1);
    return Array.from(set.entries()).map(([name, count]) => ({ name, count }));
  }, [published]);

  // Today’s showtimes (next 12)
  const todayShowtimes = useMemo(() => {
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return data.showtimes
      .filter(s => {
        const t = new Date(s.startsAt).getTime();
        return t > now && t <= endOfDay.getTime();
      })
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
      .slice(0, 12);
  }, [data.showtimes]);

  const findMovie = (id: string) => data.movies.find(m => m.id === id);
  const findCinema = (id: string) => data.cinemas.find(c => c.id === id);
  const findHall = (id: string) => data.halls.find(h => h.id === id);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        {hero && (
          <div className="absolute inset-0">
            <img
              src={hero.posterUrl}
              alt=""
              aria-hidden
              className="w-full h-full object-cover opacity-30 scale-110 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
            <div className="absolute inset-0 bg-gradient-to-l from-background via-transparent to-background/50" />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-5 gap-8 items-center">
          <div className="md:col-span-3 space-y-5">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" /> پلتفرم رزرو بلیت سینما
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              فیلمِ خوب، صندلیِ خوب،<br />
              <span className="text-primary">تجربه‌ی سینمایی واقعی</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
              فیلم موردعلاقه‌ی خود را انتخاب کنید، صندلی‌ را روی نقشه‌ی سالن ببینید،
              پرداخت را انجام دهید و بلیت QR فوری دریافت کنید.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2">
                <Link to="/movies"><PlayCircle className="size-5" /> مشاهده‌ی فیلم‌ها</Link>
              </Button>
              {hero && (
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link to="/movies/$id" params={{ id: hero.id }}>
                    شروع با «{hero.title}» <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Film className="size-4 text-primary" /> {toFa(published.length)} فیلم روی پرده</div>
              <div className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> {toFa(data.cinemas.length)} سینما</div>
              <div className="flex items-center gap-2"><Calendar className="size-4 text-primary" /> {toFa(data.showtimes.length)} سانس فعال</div>
            </div>
          </div>

          {hero && (
            <div className="md:col-span-2 flex justify-center md:justify-start">
              <div className="relative w-64 md:w-72 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/60 rotate-[-2deg] hover:rotate-0 transition-transform">
                <img src={hero.posterUrl} alt={hero.title} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                  <div className="text-white font-bold text-lg">{hero.title}</div>
                  <div className="text-white/70 text-xs flex items-center gap-2">
                    <span>{hero.genre}</span>·<span>{toFa(hero.duration)} دقیقه</span>·
                    <span className="flex items-center gap-1"><Star className="size-3 fill-yellow-400 text-yellow-400" /> {hero.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* GENRES BAR */}
      {genres.length > 0 && (
        <section className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4 flex gap-2 overflow-x-auto">
            <Link
              to="/movies"
              className="shrink-0 rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent transition"
            >
              همه ({toFa(published.length)})
            </Link>
            {genres.map(g => (
              <Link
                key={g.name}
                to="/movies"
                className="shrink-0 rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent hover:border-primary/50 transition"
              >
                {g.name} ({toFa(g.count)})
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NOW SHOWING */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">در حال اکران</h2>
            <p className="text-muted-foreground text-sm mt-1">فیلم‌هایی که همین حالا می‌توانید بلیتشان را رزرو کنید</p>
          </div>
          <Link to="/movies" className="text-sm text-primary hover:underline flex items-center gap-1">
            همه فیلم‌ها <ArrowLeft className="size-4" />
          </Link>
        </div>

        {nowShowing.length === 0 ? (
          <EmptyState
            icon={<Film className="size-10" />}
            title="فعلاً سانسی برای نمایش نیست"
            desc="به‌زودی سانس‌های جدید اضافه می‌شود."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {nowShowing.map(({ movie, next }) => (
              <Link
                key={movie.id}
                to="/movies/$id"
                params={{ id: movie.id }}
                className="group rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 transition"
              >
                <div className="aspect-[2/3] relative overflow-hidden bg-muted">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Clock className="size-3" /> {toFa(movie.duration)} دقیقه
                    </Badge>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold truncate flex-1">{movie.title}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {movie.rating}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{movie.genre}</div>
                  {next && (
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="text-primary flex items-center gap-1">
                        <Calendar className="size-3" />
                        {faDateShort(next.startsAt)} · {faTime(next.startsAt)}
                      </span>
                      <span className="text-muted-foreground">{toFa(Math.round(next.price / 1000))} هزار</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* TODAY'S SHOWTIMES */}
      {todayShowtimes.length > 0 && (
        <section className="border-y border-border bg-card/40">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">امروز روی پرده</h2>
                <p className="text-muted-foreground text-sm mt-1">سانس‌های باقی‌مانده تا پایان امروز</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayShowtimes.map(s => {
                const m = findMovie(s.movieId);
                const c = findCinema(s.cinemaId);
                const h = findHall(s.hallId);
                if (!m) return null;
                return (
                  <Link
                    key={s.id}
                    to="/showtimes/$id"
                    params={{ id: s.id }}
                    className="flex gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-accent/30 transition"
                  >
                    <img src={m.posterUrl} alt="" className="w-14 h-20 object-cover rounded-md" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {c?.name} · {h?.name}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-primary font-bold text-lg tabular-nums">{faTime(s.startsAt)}</span>
                        <span className="text-xs text-muted-foreground">
                          {toFa(s.price.toLocaleString("en-US"))} تومان
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CINEMAS */}
      {data.cinemas.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-14">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">سینماهای همکار</h2>
            <p className="text-muted-foreground text-sm mt-1">در {toFa(new Set(data.cinemas.map(c => c.city)).size)} شهر کشور</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.cinemas.map(c => {
              const hallCount = data.halls.filter(h => h.cinemaId === c.id).length;
              return (
                <Card key={c.id} className="hover:border-primary/50 transition">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
                        <MapPin className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg">{c.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{c.city} · {c.address}</div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          {toFa(hallCount)} سالن فعال
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Ticket, title: "خرید بلیت آنلاین", desc: "انتخاب صندلی روی نقشه‌ی سالن و پرداخت امن در چند ثانیه" },
            { icon: ShieldCheck, title: "بلیت QR رسمی", desc: "بلیت شما با کد یکتا و QR در گیشه اعتبارسنجی می‌شود" },
            { icon: LayoutDashboard, title: "پنل مدیریت سینما", desc: "افزودن فیلم، سالن، سانس و مشاهده‌ی گزارش‌های فروش" },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="hover:border-primary/40 transition">
              <CardContent className="p-6 space-y-3">
                <div className="size-11 rounded-xl bg-primary/15 text-primary grid place-items-center">
                  <Icon className="size-6" />
                </div>
                <div className="font-semibold text-lg">{title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-2 text-muted-foreground">
      <div className="mx-auto w-fit opacity-60">{icon}</div>
      <div className="font-semibold text-foreground">{title}</div>
      <div className="text-sm">{desc}</div>
    </div>
  );
}
