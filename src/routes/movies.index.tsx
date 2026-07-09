import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDB } from "./index";
import { toFa, formatDate, formatTime } from "@/lib/format";
import { Search, Clock, Calendar, Film, X } from "lucide-react";

const searchSchema = z.object({
  genre: z.string().optional(),
  city: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/movies/")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "فیلم‌ها — سینما آنلاین" },
      { name: "description", content: "لیست کامل فیلم‌های در حال نمایش سینماها با فیلتر ژانر و شهر." },
      { property: "og:title", content: "فیلم‌های در حال اکران" },
      { property: "og:description", content: "برنامه‌ی سانس‌های امروز و روزهای آینده." },
    ],
  }),
  component: MoviesList,
});

function MoviesList() {
  const data = useDB();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const genre = search.genre ?? "all";
  const city = search.city ?? "all";

  const genres = useMemo(() => Array.from(new Set(data.movies.map(m => m.genre))), [data.movies]);
  const cities = useMemo(() => Array.from(new Set(data.cinemas.map(c => c.city))), [data.cinemas]);

  const setParam = (key: "genre" | "city", value: string) => {
    navigate({
      search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, [key]: value === "all" ? undefined : value }),
      replace: true,
    });
  };

  const filtered = useMemo(() => {
    const cinemasInCity = new Set(
      city === "all" ? data.cinemas.map(c => c.id) : data.cinemas.filter(c => c.city === city).map(c => c.id)
    );
    const movieIds = new Set(
      data.showtimes.filter(s => cinemasInCity.has(s.cinemaId)).map(s => s.movieId)
    );
    const needle = q.trim().toLowerCase();
    return data.movies
      .filter(m => m.published)
      .filter(m => movieIds.has(m.id))
      .filter(m => genre === "all" || m.genre === genre)
      .filter(m => !needle || m.title.toLowerCase().includes(needle) || (m.originalTitle || "").toLowerCase().includes(needle))
      .map(m => {
        const next = data.showtimes
          .filter(s => s.movieId === m.id && cinemasInCity.has(s.cinemaId) && new Date(s.startsAt).getTime() > Date.now())
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
        const count = data.showtimes.filter(s => s.movieId === m.id && cinemasInCity.has(s.cinemaId)).length;
        return { movie: m, next, count };
      });
  }, [data, q, genre, city]);

  const hasFilter = genre !== "all" || city !== "all" || q.trim() !== "";

  return (
    <Layout>
      <div className="border-b border-border bg-gradient-to-b from-accent/40 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Film className="size-4" /> اکران روز
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">فیلم‌های در حال نمایش</h1>
          <p className="text-muted-foreground">{toFa(filtered.length)} فیلم مطابق جست‌وجوی شما</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative mb-4">
          <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="نام فیلم را جستجو کنید..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="pr-9 h-11"
          />
        </div>

        <div className="mb-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">ژانر</div>
          <div className="flex flex-wrap gap-2">
            <Chip active={genre === "all"} onClick={() => setParam("genre", "all")}>همه</Chip>
            {genres.map(g => (
              <Chip key={g} active={genre === g} onClick={() => setParam("genre", g)}>{g}</Chip>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">شهر</div>
          <div className="flex flex-wrap gap-2">
            <Chip active={city === "all"} onClick={() => setParam("city", "all")}>همه شهرها</Chip>
            {cities.map(c => (
              <Chip key={c} active={city === c} onClick={() => setParam("city", c)}>{c}</Chip>
            ))}
          </div>
        </div>

        {hasFilter && (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setQ(""); navigate({ search: {}, replace: true }); }}
            >
              <X className="size-4 ml-1" /> پاک کردن فیلترها
            </Button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
            فیلمی با این مشخصات یافت نشد.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(({ movie: m, next, count }) => (
              <Link
                key={m.id}
                to="/movies/$id"
                params={{ id: m.id }}
                className="group rounded-xl overflow-hidden bg-card border border-border hover:border-primary/60 hover:shadow-lg transition"
              >
                <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                  <Badge className="absolute top-2 right-2 bg-black/60 text-white border-0 backdrop-blur">
                    {m.rating}
                  </Badge>
                </div>
                <div className="p-3 space-y-2">
                  <div className="font-semibold line-clamp-1">{m.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{m.genre}</span>
                    <span>·</span>
                    <Clock className="size-3" />
                    <span>{toFa(m.duration)} دقیقه</span>
                  </div>
                  {next ? (
                    <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-border/60 text-primary">
                      <Calendar className="size-3" />
                      <span>سانس بعدی: {formatDate(next.startsAt)} — {formatTime(next.startsAt)}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground pt-1 border-t border-border/60">
                      بدون سانس فعال
                    </div>
                  )}
                  <div className="text-[11px] text-muted-foreground">
                    {toFa(count)} سانس در برنامه
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border text-foreground hover:border-primary/60"
      }`}
    >
      {children}
    </button>
  );
}
