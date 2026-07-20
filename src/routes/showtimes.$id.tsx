import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useDB } from "./index";
import { useAuth } from "@/lib/auth";
import { createReservation, generateSeats, getBookedSeats, getLockedSeats } from "@/lib/store";
import { formatDate, formatTime, money, toFa } from "@/lib/format";
import { toast } from "sonner";
import { MapPin, Clock, ArrowLeft, Info } from "lucide-react";

export const Route = createFileRoute("/showtimes/$id")({
  component: SeatPicker,
});

const MAX_SEATS = 8;

function SeatPicker() {
  const { id } = Route.useParams();
  const data = useDB();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);

  const showtime = data.showtimes.find(s => s.id === id);
  const hall = showtime ? data.halls.find(h => h.id === showtime.hallId) : null;
  const movie = showtime ? data.movies.find(m => m.id === showtime.movieId) : null;
  const cinema = showtime ? data.cinemas.find(c => c.id === showtime.cinemaId) : null;

  const seatMap = useMemo(() => hall ? generateSeats(hall) : [], [hall]);
  const booked = useMemo(() => showtime ? new Set(getBookedSeats(showtime.id)) : new Set<string>(), [data, showtime]);
  const locked = useMemo(() => showtime ? new Set(getLockedSeats(showtime.id, user?.id)) : new Set<string>(), [data, showtime, user]);

  if (!showtime || !hall || !movie || !cinema) {
    return <Layout><div className="text-center py-20">سانس یافت نشد.</div></Layout>;
  }

  const toggle = (s: string) => {
    if (booked.has(s) || locked.has(s)) return;
    setSelected(prev => {
      if (prev.includes(s)) return prev.filter(x => x !== s);
      if (prev.length >= MAX_SEATS) {
        toast.error(`حداکثر ${toFa(MAX_SEATS)} صندلی می‌توانید انتخاب کنید`);
        return prev;
      }
      return [...prev, s];
    });
  };

  const proceed = async () => {
    if (!user) { toast.error("برای رزرو ابتدا وارد شوید"); navigate({ to: "/login" }); return; }
    if (selected.length === 0) { toast.error("حداقل یک صندلی انتخاب کنید"); return; }
    try {
      const reservation = await createReservation(showtime.id, selected);
      navigate({ to: "/checkout/$rid", params: { rid: reservation.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "رزرو ناموفق بود");
    }
  };

  const total = showtime.price * selected.length;
  const totalSeats = hall.rows * hall.seatsPerRow;
  const availableCount = totalSeats - booked.size - locked.size;
  const occupancy = Math.round(((booked.size + locked.size) / totalSeats) * 100);

  const rows: string[][] = [];
  for (let i = 0; i < hall.rows; i++) {
    rows.push(seatMap.slice(i * hall.seatsPerRow, (i + 1) * hall.seatsPerRow));
  }
  const rowLabels = "ABCDEFGHIJKL";

  return (
    <Layout>
      {/* Header strip */}
      <div className="border-b border-border bg-accent/30">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/movies/$id" params={{ id: movie.id }} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-5" />
            </Link>
            <img src={movie.posterUrl} alt="" className="w-12 h-16 rounded object-cover hidden sm:block" />
            <div>
              <h1 className="text-lg md:text-xl font-bold">{movie.title}</h1>
              <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap mt-0.5">
                <span className="flex items-center gap-1"><MapPin className="size-3" />{cinema.name} — {hall.name}</span>
                <span className="flex items-center gap-1"><Clock className="size-3" />{formatDate(showtime.startsAt)} · {formatTime(showtime.startsAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <div className="text-muted-foreground">آزاد</div>
              <div className="font-bold text-success">{toFa(availableCount)}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">اشغال</div>
              <div className="font-bold">{toFa(occupancy)}٪</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 pb-32">
        {/* Screen + seats */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="max-w-lg mx-auto mb-8">
            <div className="screen-curve" />
            <div className="text-center text-xs text-muted-foreground uppercase tracking-widest">پرده سینما</div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-max mx-auto flex flex-col items-center gap-1.5" dir="ltr">
              {rows.map((r, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <div className="w-6 text-center text-[11px] text-muted-foreground font-medium">{rowLabels[i]}</div>
                  {r.map((s, idx) => {
                    const isBooked = booked.has(s);
                    const isLocked = locked.has(s);
                    const isSel = selected.includes(s);
                    const cls = isBooked
                      ? "seat seat-booked"
                      : isLocked
                        ? "seat seat-locked"
                        : isSel
                          ? "seat seat-selected"
                          : "seat seat-available";
                    // aisle after middle
                    const isAisle = idx === Math.floor(hall.seatsPerRow / 2) - 1;
                    return (
                      <div key={s} className={isAisle ? "flex gap-3.5" : ""}>
                        <button className={cls} onClick={() => toggle(s)} disabled={isBooked || isLocked} aria-label={`صندلی ${s}`}>
                          {s.slice(1)}
                        </button>
                      </div>
                    );
                  })}
                  <div className="w-6 text-center text-[11px] text-muted-foreground font-medium">{rowLabels[i]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs">
            <Legend cls="seat-available" label="آزاد" />
            <Legend cls="seat-selected" label="انتخاب شما" />
            <Legend cls="seat-locked" label="در حال رزرو" />
            <Legend cls="seat-booked" label="فروخته شده" />
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/30 border border-border rounded-lg p-3">
          <Info className="size-4 shrink-0 mt-0.5" />
          <span>پس از انتخاب صندلی‌ها ۱۰ دقیقه فرصت دارید پرداخت را تکمیل کنید. در غیر این صورت رزرو به‌طور خودکار لغو می‌شود.</span>
        </div>
      </div>

      {/* Sticky summary */}
      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <div className="text-[11px] text-muted-foreground">صندلی‌ها ({toFa(selected.length)})</div>
              <div className="font-semibold text-sm">
                {selected.length === 0 ? "هنوز صندلی انتخاب نشده" : selected.slice().sort().join("، ")}
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div>
              <div className="text-[11px] text-muted-foreground">مبلغ کل</div>
              <div className="font-bold text-lg text-primary">{money(total)}</div>
            </div>
          </div>
          <Button size="lg" onClick={proceed} disabled={selected.length === 0} className="min-w-[160px]">
            ادامه به پرداخت
          </Button>
        </div>
      </div>
    </Layout>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`seat ${cls}`} style={{ width: 18, height: 18, cursor: "default" }} />
      {label}
    </span>
  );
}
