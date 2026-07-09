import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDB } from "./index";
import { completePayment } from "@/lib/store";
import { formatDate, formatTime, mmss, money, toFa } from "@/lib/format";
import { toast } from "sonner";
import { CreditCard, Timer, ShieldCheck, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/$rid")({
  component: Checkout,
});

const BANKS = [
  { id: "melli", name: "بانک ملی" },
  { id: "saderat", name: "بانک صادرات" },
  { id: "mellat", name: "بانک ملت" },
  { id: "parsian", name: "بانک پارسیان" },
];

function Checkout() {
  const { rid } = Route.useParams();
  const data = useDB();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [bank, setBank] = useState("melli");
  const [pan, setPan] = useState("6037 9975 " + Math.floor(1000 + Math.random() * 9000) + " " + Math.floor(1000 + Math.random() * 9000));
  const [cvv, setCvv] = useState("");
  const [exp, setExp] = useState("");
  const [otp, setOtp] = useState("");

  const reservation = data.reservations.find(r => r.id === rid);
  const showtime = reservation ? data.showtimes.find(s => s.id === reservation.showtimeId) : null;
  const movie = showtime ? data.movies.find(m => m.id === showtime.movieId) : null;
  const cinema = showtime ? data.cinemas.find(c => c.id === showtime.cinemaId) : null;
  const hall = showtime ? data.halls.find(h => h.id === showtime.hallId) : null;

  useEffect(() => {
    if (!reservation) return;
    const update = () => {
      const s = Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(s);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [reservation]);

  const canPay = useMemo(() => {
    return pan.replace(/\s/g, "").length >= 16 && cvv.length >= 3 && exp.length >= 5 && otp.length >= 4;
  }, [pan, cvv, exp, otp]);

  if (!reservation) return <Layout><div className="text-center py-20">رزرو یافت نشد.</div></Layout>;
  if (reservation.status === "paid") {
    return <Layout><div className="text-center py-20 space-y-3">
      <p>این رزرو قبلاً پرداخت شده است.</p>
      <Button onClick={() => navigate({ to: "/my-tickets" })}>بلیت‌های من</Button>
    </div></Layout>;
  }

  const pay = async (success: boolean) => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1200));
    const res = completePayment(reservation.id, success);
    setProcessing(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("پرداخت موفق. بلیت شما صادر شد.");
    navigate({ to: "/tickets/$id", params: { id: res.ticket!.id } });
  };

  const expired = remaining === 0;
  const bankName = BANKS.find(b => b.id === bank)?.name;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/showtimes/$id" params={{ id: reservation.showtimeId }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4" /> بازگشت به انتخاب صندلی
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Payment gateway */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="bg-gradient-to-l from-primary/20 to-transparent p-5 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-success" />
                    <div>
                      <div className="font-semibold">درگاه پرداخت امن</div>
                      <div className="text-xs text-muted-foreground">شاپرک · حالت آزمایشی</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="size-3" /> اتصال SSL
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <Label className="mb-2 block text-xs">انتخاب بانک صادرکننده کارت</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {BANKS.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setBank(b.id)}
                        className={`text-xs p-2 rounded-lg border transition ${
                          bank === b.id
                            ? "bg-primary/10 border-primary text-foreground"
                            : "bg-background border-border hover:border-primary/60"
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-xs">شماره کارت</Label>
                  <Input
                    value={pan}
                    onChange={e => setPan(e.target.value)}
                    dir="ltr"
                    inputMode="numeric"
                    className="font-mono tracking-widest text-center text-lg"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="mb-2 block text-xs">CVV2</Label>
                    <Input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, ""))} maxLength={4} dir="ltr" className="text-center font-mono" placeholder="123" />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs">تاریخ انقضا</Label>
                    <Input value={exp} onChange={e => setExp(e.target.value)} maxLength={5} dir="ltr" className="text-center font-mono" placeholder="04/07" />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs">رمز پویا</Label>
                    <div className="flex gap-1">
                      <Input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} maxLength={6} dir="ltr" className="text-center font-mono" placeholder="******" />
                      <Button type="button" variant="outline" size="sm" onClick={() => { setOtp(String(Math.floor(100000 + Math.random() * 900000))); toast.success("رمز پویا ارسال شد"); }}>
                        دریافت
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <Button size="lg" className="w-full" onClick={() => pay(true)} disabled={processing || expired || !canPay}>
                    <CreditCard className="size-4 ml-2" />
                    {processing ? "در حال پردازش..." : `پرداخت ${money(reservation.total)}`}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => pay(false)} disabled={processing || expired}>
                      شبیه‌سازی پرداخت ناموفق
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>انصراف</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3" />
              اطلاعات کارت شما در این نسخه‌ی آزمایشی ذخیره یا ارسال نمی‌شود.
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 lg:sticky lg:top-4">
              <h2 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" /> خلاصه سفارش
              </h2>

              {movie && (
                <div className="flex gap-3">
                  <img src={movie.posterUrl} alt="" className="w-16 h-24 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{movie.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{cinema?.name} — {hall?.name}</div>
                    <div className="text-xs text-muted-foreground">{showtime && `${formatDate(showtime.startsAt)} · ${formatTime(showtime.startsAt)}`}</div>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <Row label="صندلی‌ها" value={reservation.seats.slice().sort().join("، ")} />
                <Row label="تعداد" value={`${toFa(reservation.seats.length)} بلیت`} />
                <Row label="مبلغ هر بلیت" value={money(showtime?.price ?? 0)} />
                <Row label="بانک" value={bankName ?? ""} />
              </div>

              <div className="border-t border-border pt-3 flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">مبلغ قابل پرداخت</span>
                <span className="font-bold text-2xl text-primary">{money(reservation.total)}</span>
              </div>

              <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${
                expired ? "bg-destructive/10 text-destructive" : remaining < 60 ? "bg-warning/10 text-warning" : "bg-accent/40"
              }`}>
                <Timer className="size-4" />
                {expired ? (
                  <span>زمان رزرو منقضی شد. لطفاً دوباره صندلی انتخاب کنید.</span>
                ) : (
                  <span>مهلت پرداخت: <span className="font-mono font-bold">{mmss(remaining)}</span></span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
