import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout, RequireRole } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDB } from "./index";
import { addCinema, addHall, addMovie, addShowtime, deleteMovie, deleteShowtime } from "@/lib/store";
import { formatDateTime, money, toFa } from "@/lib/format";
import { toast } from "sonner";
import { Film, Building2, Calendar, TrendingUp, Plus } from "lucide-react";

export const Route = createFileRoute("/manager")({
  component: ManagerDashboard,
});

function ManagerDashboard() {
  return (
    <Layout>
      <RequireRole roles={["manager", "admin"]}>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div>
            <div className="text-xs text-muted-foreground">داشبورد مدیر سینما</div>
            <h1 className="text-3xl font-bold mt-1">مدیریت اکران و فروش</h1>
          </div>
          <StatsRow />
          <Tabs defaultValue="movies">
            <TabsList>
              <TabsTrigger value="movies"><Film className="size-4 ml-1" /> فیلم‌ها</TabsTrigger>
              <TabsTrigger value="cinemas"><Building2 className="size-4 ml-1" /> سینما و سالن</TabsTrigger>
              <TabsTrigger value="showtimes"><Calendar className="size-4 ml-1" /> سانس‌ها</TabsTrigger>
              <TabsTrigger value="sales"><TrendingUp className="size-4 ml-1" /> گزارش فروش</TabsTrigger>
            </TabsList>
            <TabsContent value="movies"><MoviesTab /></TabsContent>
            <TabsContent value="cinemas"><CinemasTab /></TabsContent>
            <TabsContent value="showtimes"><ShowtimesTab /></TabsContent>
            <TabsContent value="sales"><SalesTab /></TabsContent>
          </Tabs>
        </div>
      </RequireRole>
    </Layout>
  );
}

function StatsRow() {
  const data = useDB();
  const validTickets = data.tickets.filter(t => t.status !== "cancelled");
  const revenue = validTickets.reduce((s, t) => s + t.amount, 0);
  const seatsSold = validTickets.reduce((s, t) => s + t.seats.length, 0);
  const upcomingShows = data.showtimes.filter(s => new Date(s.startsAt).getTime() > Date.now()).length;

  const cards = [
    { label: "درآمد کل", value: money(revenue), tone: "primary" as const, icon: <TrendingUp className="size-4" /> },
    { label: "بلیت فروخته", value: toFa(seatsSold), icon: <Film className="size-4" /> },
    { label: "سانس‌های آینده", value: toFa(upcomingShows), icon: <Calendar className="size-4" /> },
    { label: "فیلم‌ها", value: toFa(data.movies.length), icon: <Film className="size-4" /> },
    { label: "سالن‌ها", value: toFa(data.halls.length), icon: <Building2 className="size-4" /> },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`rounded-xl border p-4 ${c.tone === "primary" ? "bg-primary/10 border-primary/40" : "bg-card border-border"}`}>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">{c.icon}{c.label}</div>
          <div className={`text-xl font-bold ${c.tone === "primary" ? "text-primary" : ""}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function MoviesTab() {
  const data = useDB();
  const [form, setForm] = useState({ title: "", genre: "درام", duration: "120", rating: "+۱۳", description: "", posterUrl: "" });

  const add = async () => {
    if (!form.title.trim() || !form.posterUrl.trim()) { toast.error("عنوان و پوستر لازم است"); return; }
    try {
      await addMovie({
        title: form.title, genre: form.genre,
        duration: parseInt(form.duration) || 100,
        rating: form.rating, description: form.description,
        posterUrl: form.posterUrl, published: true,
      });
      toast.success("فیلم اضافه شد");
      setForm({ title: "", genre: "درام", duration: "120", rating: "+۱۳", description: "", posterUrl: "" });
    } catch (error) { toast.error(error instanceof Error ? error.message : "افزودن ناموفق بود"); }
  };

  const remove = async (id: string) => {
    try { await deleteMovie(id); toast.success("حذف شد"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "حذف ناموفق بود"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-base">افزودن فیلم جدید</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>عنوان</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>ژانر</Label><Input value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>مدت (دقیقه)</Label><Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
            <div><Label>رده سنی</Label><Input value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} /></div>
          </div>
          <div><Label>لینک پوستر</Label><Input dir="ltr" value={form.posterUrl} onChange={e => setForm({ ...form, posterUrl: e.target.value })} placeholder="https://..." /></div>
          <div><Label>توضیحات</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <Button onClick={add} className="w-full"><Plus className="size-4 ml-1" /> افزودن فیلم</Button>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">فیلم‌های موجود ({toFa(data.movies.length)})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>عنوان</TableHead><TableHead>ژانر</TableHead><TableHead>مدت</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.movies.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="flex items-center gap-2">
                    <img src={m.posterUrl} alt="" className="w-8 h-12 rounded object-cover" />
                    {m.title}
                  </TableCell>
                  <TableCell>{m.genre}</TableCell>
                  <TableCell>{toFa(m.duration)}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => remove(m.id)}>حذف</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CinemasTab() {
  const data = useDB();
  const [cinema, setCinema] = useState({ name: "", city: "", address: "" });
  const [hall, setHall] = useState({ cinemaId: data.cinemas[0]?.id || "", name: "", rows: "6", seatsPerRow: "10" });

  const createCinema = async () => {
    if (!cinema.name.trim()) { toast.error("نام سینما لازم است"); return; }
    try { await addCinema(cinema); toast.success("سینما اضافه شد"); setCinema({ name: "", city: "", address: "" }); }
    catch (error) { toast.error(error instanceof Error ? error.message : "افزودن ناموفق بود"); }
  };
  const createHall = async () => {
    if (!hall.name.trim() || !hall.cinemaId) { toast.error("اطلاعات ناقص است"); return; }
    try {
      await addHall({ cinemaId: hall.cinemaId, name: hall.name, rows: parseInt(hall.rows) || 5, seatsPerRow: parseInt(hall.seatsPerRow) || 8 });
      toast.success("سالن اضافه شد"); setHall({ ...hall, name: "" });
    } catch (error) { toast.error(error instanceof Error ? error.message : "افزودن ناموفق بود"); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      <Card><CardHeader><CardTitle className="text-base">افزودن سینما</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>نام</Label><Input value={cinema.name} onChange={e => setCinema({ ...cinema, name: e.target.value })} /></div>
          <div><Label>شهر</Label><Input value={cinema.city} onChange={e => setCinema({ ...cinema, city: e.target.value })} /></div>
          <div><Label>آدرس</Label><Input value={cinema.address} onChange={e => setCinema({ ...cinema, address: e.target.value })} /></div>
          <Button onClick={createCinema} className="w-full"><Plus className="size-4 ml-1" /> افزودن سینما</Button>
          <div className="border-t pt-3">
            <div className="text-sm font-medium mb-2">سینماهای موجود</div>
            {data.cinemas.map(c => <div key={c.id} className="text-sm py-1">{c.name} — {c.city}</div>)}
          </div>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="text-base">افزودن سالن</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>سینما</Label>
            <Select value={hall.cinemaId} onValueChange={v => setHall({ ...hall, cinemaId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{data.cinemas.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>نام سالن</Label><Input value={hall.name} onChange={e => setHall({ ...hall, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>تعداد ردیف</Label><Input type="number" value={hall.rows} onChange={e => setHall({ ...hall, rows: e.target.value })} /></div>
            <div><Label>صندلی در ردیف</Label><Input type="number" value={hall.seatsPerRow} onChange={e => setHall({ ...hall, seatsPerRow: e.target.value })} /></div>
          </div>
          <Button onClick={createHall} className="w-full"><Plus className="size-4 ml-1" /> افزودن سالن</Button>
          <div className="border-t pt-3">
            <div className="text-sm font-medium mb-2">سالن‌های موجود</div>
            {data.halls.map(h => {
              const c = data.cinemas.find(x => x.id === h.cinemaId);
              return <div key={h.id} className="text-sm py-1">{c?.name} · {h.name} ({toFa(h.rows)}×{toFa(h.seatsPerRow)})</div>;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ShowtimesTab() {
  const data = useDB();
  const [form, setForm] = useState({ movieId: data.movies[0]?.id || "", hallId: data.halls[0]?.id || "", date: "", time: "20:00", price: "150000" });

  const add = async () => {
    if (!form.movieId || !form.hallId || !form.date) { toast.error("اطلاعات ناقص است"); return; }
    const dt = new Date(`${form.date}T${form.time}:00`);
    try {
      await addShowtime({ movieId: form.movieId, hallId: form.hallId, startsAt: dt.toISOString(), price: parseInt(form.price) || 100000 });
      toast.success("سانس اضافه شد");
    } catch (error) { toast.error(error instanceof Error ? error.message : "افزودن ناموفق بود"); }
  };

  const remove = async (id: string) => {
    try { await deleteShowtime(id); toast.success("حذف شد"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "حذف ناموفق بود"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
      <Card><CardHeader><CardTitle className="text-base">افزودن سانس</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>فیلم</Label>
            <Select value={form.movieId} onValueChange={v => setForm({ ...form, movieId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{data.movies.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>سالن</Label>
            <Select value={form.hallId} onValueChange={v => setForm({ ...form, hallId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{data.halls.map(h => {
                const c = data.cinemas.find(x => x.id === h.cinemaId);
                return <SelectItem key={h.id} value={h.id}>{c?.name} — {h.name}</SelectItem>;
              })}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>تاریخ</Label><Input type="date" dir="ltr" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>ساعت</Label><Input type="time" dir="ltr" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
          </div>
          <div><Label>قیمت بلیت (تومان)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
          <Button onClick={add} className="w-full"><Plus className="size-4 ml-1" /> افزودن سانس</Button>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">سانس‌های آینده</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>فیلم</TableHead><TableHead>سالن</TableHead><TableHead>زمان</TableHead><TableHead>قیمت</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.showtimes.filter(s => new Date(s.startsAt).getTime() > Date.now()).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map(s => {
                const m = data.movies.find(x => x.id === s.movieId);
                const h = data.halls.find(x => x.id === s.hallId);
                const c = data.cinemas.find(x => x.id === s.cinemaId);
                return (
                  <TableRow key={s.id}>
                    <TableCell>{m?.title}</TableCell>
                    <TableCell>{c?.name} — {h?.name}</TableCell>
                    <TableCell>{formatDateTime(s.startsAt)}</TableCell>
                    <TableCell>{money(s.price)}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={() => remove(s.id)}>حذف</Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SalesTab() {
  const data = useDB();
  const validTickets = data.tickets.filter(t => t.status !== "cancelled");

  const bySt = new Map<string, { count: number; revenue: number }>();
  for (const t of validTickets) {
    const cur = bySt.get(t.showtimeId) || { count: 0, revenue: 0 };
    cur.count += t.seats.length;
    cur.revenue += t.amount;
    bySt.set(t.showtimeId, cur);
  }

  // Top movies by revenue
  const byMovie = new Map<string, { count: number; revenue: number }>();
  for (const t of validTickets) {
    const st = data.showtimes.find(s => s.id === t.showtimeId);
    if (!st) continue;
    const cur = byMovie.get(st.movieId) || { count: 0, revenue: 0 };
    cur.count += t.seats.length;
    cur.revenue += t.amount;
    byMovie.set(st.movieId, cur);
  }
  const topMovies = Array.from(byMovie.entries())
    .map(([id, v]) => ({ movie: data.movies.find(m => m.id === id), ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxRev = Math.max(1, ...topMovies.map(m => m.revenue));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-base">پرفروش‌ترین فیلم‌ها</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {topMovies.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">هنوز فروشی ثبت نشده است.</p>}
          {topMovies.map((m, i) => (
            <div key={m.movie?.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`size-6 rounded-full text-xs flex items-center justify-center shrink-0 ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{toFa(i + 1)}</span>
                  <span className="truncate">{m.movie?.title}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{toFa(m.count)} بلیت</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${(m.revenue / maxRev) * 100}%` }} />
              </div>
              <div className="text-xs text-primary font-semibold">{money(m.revenue)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">گزارش فروش هر سانس</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>فیلم</TableHead><TableHead>سانس</TableHead><TableHead>اشغال</TableHead><TableHead>درآمد</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.showtimes
                  .slice()
                  .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
                  .map(s => {
                    const st = bySt.get(s.id) || { count: 0, revenue: 0 };
                    const h = data.halls.find(x => x.id === s.hallId);
                    const m = data.movies.find(x => x.id === s.movieId);
                    const capacity = (h?.rows || 0) * (h?.seatsPerRow || 0);
                    const pct = Math.round((st.count / (capacity || 1)) * 100);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{m?.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(s.startsAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full ${pct >= 80 ? "bg-destructive" : pct >= 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs w-16 text-left">{toFa(st.count)}/{toFa(capacity)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-primary font-semibold">{money(st.revenue)}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
