import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Layout, RequireRole } from "@/components/Layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDB } from "./index";
import { deleteUser, resetDB, updateUserRole, type Role } from "@/lib/store";
import { toFa, money, formatDateTime } from "@/lib/format";
import { roleLabel } from "@/lib/auth";
import { Users, Building2, Activity, Trash2, DollarSign, Film, Ticket as TicketIcon, TrendingUp, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-destructive/15 text-destructive border-destructive/30",
  manager: "bg-primary/15 text-primary border-primary/30",
  staff: "bg-warning/15 text-warning border-warning/30",
  customer: "bg-muted text-muted-foreground border-border",
};

function AdminPage() {
  const data = useDB();

  const stats = useMemo(() => {
    const validTickets = data.tickets.filter(t => t.status !== "cancelled");
    const revenue = validTickets.reduce((s, t) => s + t.amount, 0);
    const seatsSold = validTickets.reduce((s, t) => s + t.seats.length, 0);
    const usedTickets = data.tickets.filter(t => t.status === "used").length;
    const activeLocks = data.locks.filter(l => new Date(l.expiresAt).getTime() > Date.now()).length;
    const paySuccess = data.payments.length
      ? Math.round(data.payments.filter(p => p.status === "success").length / data.payments.length * 100)
      : 0;
    return { revenue, seatsSold, usedTickets, activeLocks, paySuccess };
  }, [data]);

  // Revenue by day (last 7 days)
  const revenueSeries = useMemo(() => {
    const days: { key: string; label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, label: toFa(d.getDate()), total: 0 });
    }
    for (const t of data.tickets.filter(t => t.status !== "cancelled")) {
      const key = t.createdAt.slice(0, 10);
      const bucket = days.find(x => x.key === key);
      if (bucket) bucket.total += t.amount;
    }
    return days;
  }, [data.tickets]);

  const maxRev = Math.max(1, ...revenueSeries.map(d => d.total));
  const roleCounts = data.users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {} as Record<Role, number>);

  return (
    <Layout>
      <RequireRole roles={["admin"]}>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" /> پنل مدیریت سیستم
              </div>
              <h1 className="text-3xl font-bold mt-1">داشبورد ادمین</h1>
              <p className="text-sm text-muted-foreground mt-1">مرور کلی وضعیت پلتفرم، کاربران و درآمد.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (confirm("همه‌ی داده‌ها به حالت اولیه بازمی‌گردد. ادامه؟")) {
                  try { await resetDB(); toast.success("داده‌ها بازنشانی شد"); }
                  catch (error) { toast.error(error instanceof Error ? error.message : "بازنشانی ناموفق بود"); }
                }
              }}
            >
              <RefreshCw className="size-4 ml-1" /> بازنشانی داده‌های آزمایشی
            </Button>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={<DollarSign className="size-4" />} label="درآمد کل" value={money(stats.revenue)} tone="primary" />
            <KpiCard icon={<TicketIcon className="size-4" />} label="بلیت فروخته" value={toFa(stats.seatsSold)} sub={`${toFa(stats.usedTickets)} استفاده شده`} />
            <KpiCard icon={<Users className="size-4" />} label="کاربران" value={toFa(data.users.length)} />
            <KpiCard icon={<Film className="size-4" />} label="فیلم/سانس" value={`${toFa(data.movies.length)} / ${toFa(data.showtimes.length)}`} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  <div className="font-semibold">درآمد ۷ روز اخیر</div>
                </div>
                <div className="text-xs text-muted-foreground">مجموع: {money(revenueSeries.reduce((s, d) => s + d.total, 0))}</div>
              </div>
              <div className="flex items-end justify-between gap-2 h-40" dir="ltr">
                {revenueSeries.map(d => (
                  <div key={d.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground" title={money(d.total)}>
                      {d.total > 0 ? toFa(Math.round(d.total / 1000)) + "k" : ""}
                    </div>
                    <div className="w-full rounded-t bg-gradient-to-t from-primary to-primary/40 min-h-[4px] transition-all"
                         style={{ height: `${Math.max(4, (d.total / maxRev) * 130)}px` }} />
                    <div className="text-[10px] text-muted-foreground">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="font-semibold mb-4 flex items-center gap-2"><Users className="size-4 text-primary" /> توزیع کاربران</div>
              <div className="space-y-3">
                {(["admin", "manager", "staff", "customer"] as Role[]).map(r => {
                  const n = roleCounts[r] ?? 0;
                  const pct = data.users.length ? (n / data.users.length) * 100 : 0;
                  return (
                    <div key={r}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{roleLabel[r]}</span>
                        <span className="text-muted-foreground">{toFa(n)} کاربر</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users"><Users className="size-4 ml-1" /> کاربران</TabsTrigger>
              <TabsTrigger value="cinemas"><Building2 className="size-4 ml-1" /> سینماها</TabsTrigger>
              <TabsTrigger value="system"><Activity className="size-4 ml-1" /> وضعیت سیستم</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="rounded-xl border border-border bg-card mt-4 overflow-hidden">
                <div className="p-4 border-b border-border font-semibold">همه‌ی کاربران ({toFa(data.users.length)})</div>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>کاربر</TableHead><TableHead>ایمیل</TableHead><TableHead>نقش</TableHead><TableHead>عضویت</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                              {u.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-medium">{u.name}</div>
                              <div className="text-[11px] text-muted-foreground">
                                <span className={`px-1.5 py-0.5 rounded border text-[10px] ${ROLE_COLORS[u.role]}`}>{roleLabel[u.role]}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell dir="ltr" className="text-xs text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Select value={u.role} onValueChange={async (v: Role) => {
                            try { await updateUserRole(u.id, v); toast.success("نقش به‌روزرسانی شد"); }
                            catch (error) { toast.error(error instanceof Error ? error.message : "به‌روزرسانی ناموفق بود"); }
                          }}>
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["customer", "manager", "staff", "admin"] as Role[]).map(r => (
                                <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(u.createdAt)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            if (!confirm(`حذف کاربر «${u.name}»؟`)) return;
                            try { await deleteUser(u.id); toast.success("کاربر حذف شد"); }
                            catch (error) { toast.error(error instanceof Error ? error.message : "حذف ناموفق بود"); }
                          }}><Trash2 className="size-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="cinemas">
              <div className="rounded-xl border border-border bg-card mt-4 overflow-hidden">
                <div className="p-4 border-b border-border font-semibold">سینماها و آمار عملیاتی</div>
                <Table>
                  <TableHeader><TableRow><TableHead>سینما</TableHead><TableHead>شهر</TableHead><TableHead>سالن‌ها</TableHead><TableHead>سانس‌ها</TableHead><TableHead>درآمد</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.cinemas.map(c => {
                      const stIds = new Set(data.showtimes.filter(s => s.cinemaId === c.id).map(s => s.id));
                      const rev = data.tickets
                        .filter(t => t.status !== "cancelled" && stIds.has(t.showtimeId))
                        .reduce((s, t) => s + t.amount, 0);
                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-[11px] text-muted-foreground">{c.address}</div>
                          </TableCell>
                          <TableCell>{c.city}</TableCell>
                          <TableCell>{toFa(data.halls.filter(h => h.cinemaId === c.id).length)}</TableCell>
                          <TableCell>{toFa(stIds.size)}</TableCell>
                          <TableCell className="text-primary font-semibold">{money(rev)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="system">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="font-semibold flex items-center gap-2"><Activity className="size-4 text-success" /> سلامت سیستم</div>
                  <StatusRow label="پایگاه داده" value={<Badge className="bg-success text-white">فعال</Badge>} />
                  <StatusRow label="درگاه پرداخت" value={<Badge className="bg-success text-white">آنلاین</Badge>} />
                  <StatusRow label="سرویس اسکن بلیت" value={<Badge className="bg-success text-white">در دسترس</Badge>} />
                </div>
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="font-semibold flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> شاخص‌های عملیاتی</div>
                  <StatusRow label="قفل‌های صندلی فعال" value={toFa(stats.activeLocks)} />
                  <StatusRow label="رزروهای در انتظار" value={toFa(data.reservations.filter(r => r.status === "pending").length)} />
                  <StatusRow label="پرداخت‌های ثبت شده" value={toFa(data.payments.length)} />
                  <StatusRow label="نرخ موفقیت پرداخت" value={
                    <span className={stats.paySuccess >= 80 ? "text-success font-semibold" : "text-warning font-semibold"}>
                      {toFa(stats.paySuccess)}٪
                    </span>
                  } />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </RequireRole>
    </Layout>
  );
}

function KpiCard({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: "primary" }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "primary" ? "bg-primary/10 border-primary/40" : "bg-card border-border"}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">{icon}{label}</div>
      <div className={`text-2xl font-bold ${tone === "primary" ? "text-primary" : ""}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
