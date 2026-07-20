import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDB } from "./index";
import { formatDate, formatTime, money, toFa } from "@/lib/format";
import { CheckCircle2, XCircle, Download, MapPin, Clock, Armchair, Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tickets/$id")({
  component: TicketPage,
});

function TicketPage() {
  const { id } = Route.useParams();
  const data = useDB();
  const ticket = data.tickets.find(t => t.id === id);
  const showtime = ticket ? data.showtimes.find(s => s.id === ticket.showtimeId) : null;
  const movie = showtime ? data.movies.find(m => m.id === showtime.movieId) : null;
  const cinema = showtime ? data.cinemas.find(c => c.id === showtime.cinemaId) : null;
  const hall = showtime ? data.halls.find(h => h.id === showtime.hallId) : null;

  if (!ticket || !showtime || !movie) {
    return <Layout><div className="text-center py-20">بلیت یافت نشد.</div></Layout>;
  }

  const qrData = JSON.stringify({ code: ticket.code, showtime: ticket.showtimeId, seats: ticket.seats });

  const statusBadge =
    ticket.status === "valid" ? <Badge className="bg-success text-white">معتبر</Badge> :
    ticket.status === "used" ? <Badge variant="secondary"><XCircle className="size-3 ml-1" /> استفاده شده</Badge> :
    <Badge variant="destructive">لغو شده</Badge>;

  const copyTicketCode = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(ticket.code);
      toast.success("کد بلیت کپی شد");
    } catch {
      toast.error("کپی کد بلیت امکان‌پذیر نیست");
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {ticket.status === "valid" && (
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center size-14 rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="text-2xl font-bold">بلیت شما آماده است</h1>
            <p className="text-muted-foreground text-sm">این بلیت را در ورودی سینما به کارمند نشان دهید.</p>
          </div>
        )}

        {/* Ticket card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
          {/* Header */}
          <div className="relative bg-gradient-to-l from-primary to-primary/70 text-primary-foreground p-6">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,white_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-xs opacity-90 flex items-center gap-1.5">
                  <TicketIcon className="size-3" /> بلیت الکترونیکی
                </div>
                <div className="font-bold text-xl mt-1">{movie.title}</div>
                <div className="text-xs opacity-80 mt-1">{cinema?.name} — {hall?.name}</div>
              </div>
              {statusBadge}
            </div>
          </div>

          {/* Perforation */}
          <div className="relative bg-card">
            <div className="absolute -top-3 -right-3 size-6 rounded-full bg-background" />
            <div className="absolute -top-3 -left-3 size-6 rounded-full bg-background" />
            <div className="border-b border-dashed border-border/60 mx-6" />
          </div>

          {/* Body */}
          <div className="bg-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoBlock icon={<Clock className="size-4" />} label="تاریخ" value={formatDate(showtime.startsAt)} />
                <InfoBlock icon={<Clock className="size-4" />} label="ساعت شروع" value={formatTime(showtime.startsAt)} />
                <InfoBlock icon={<MapPin className="size-4" />} label="سالن" value={hall?.name ?? "—"} />
                <InfoBlock icon={<Armchair className="size-4" />} label="صندلی‌ها" value={ticket.seats.slice().sort().join("، ")} />
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground">کد بلیت</div>
                  <div className="font-mono text-lg font-bold tracking-wider" dir="ltr">{ticket.code}</div>
                </div>
                <div className="text-left">
                  <div className="text-[11px] text-muted-foreground">مبلغ</div>
                  <div className="font-bold text-primary">{money(ticket.amount)}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl" dir="ltr">
              <QRCodeSVG value={qrData} size={140} />
              <div className="text-[11px] text-black mt-2 font-mono">{ticket.code}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-accent/40 px-6 py-3 text-[11px] text-muted-foreground flex justify-between border-t border-border">
            <span>لطفاً ۱۵ دقیقه قبل از شروع سانس در سینما حضور داشته باشید.</span>
            <span>تعداد: {toFa(ticket.seats.length)} بلیت</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex-1" onClick={() => { window.print(); }}>
            <Download className="size-4 ml-2" /> چاپ / ذخیره
          </Button>
          <Button variant="outline" className="flex-1" onClick={copyTicketCode}>
            کپی کد بلیت
          </Button>
          <Button asChild className="flex-1"><Link to="/my-tickets">بلیت‌های من</Link></Button>
        </div>
      </div>
    </Layout>
  );
}

function InfoBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-0.5">{icon}{label}</div>
      <div className="font-semibold text-sm">{value}</div>
    </div>
  );
}
