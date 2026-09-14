import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Banknote, Layers3, ShieldCheck, ShoppingBag } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import {
  compactRupiah,
  rupiah,
} from "@/lib/skillpill-data";
import { useSkillpill } from "@/lib/skillpill-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard SkillPill — Monitoring User & Omzet" },
      {
        name: "description",
        content:
          "Panel admin SkillPill: monitoring user, omzet, pesanan terbaru, katalog skill, dan leaderboard pembelajar.",
      },
      { property: "og:title", content: "Dashboard SkillPill — Monitoring User & Omzet" },
      {
        property: "og:description",
        content: "Satu konsol untuk memantau user, omzet, dan performa katalog SkillPill.",
      },
    ],
  }),
  component: DashboardPage,
});

const statusClass: Record<string, string> = {
  Lunas: "bg-primary/15 text-primary",
  Pending: "bg-gold/15 text-gold",
  Gagal: "bg-destructive/15 text-destructive",
};

function DashboardPage() {
  const { skills, orders, users, leaderboard, isLoading, error, refresh } = useSkillpill();
  const learners = users.filter((user) => user.role === "user");
  const paidOrders = orders.filter((order) => order.status === "paid");
  const totalOmzet = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = paidOrders.length;
  const revenueTrend = Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (7 - index));
    const omzet = paidOrders
      .filter((order) => {
        const created = new Date(order.createdAt);
        return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
      })
      .reduce((total, order) => total + order.total, 0);
    return { month: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date), omzet };
  });
  const maxTrend = Math.max(1, ...revenueTrend.map((point) => point.omzet));
  const topSkills = [...skills]
    .filter((skill) => skill.orders > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);
  const recentOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  ).slice(0, 6);

  if (isLoading) {
    return <AdminShell eyebrow="(01) Monitoring" title="Dashboard SkillPill" description="Memuat data platform…"><p className="panel p-6 text-sm text-muted-foreground">Menghubungkan dashboard ke data SkillPill.</p></AdminShell>;
  }

  if (error) {
    return <AdminShell eyebrow="(01) Monitoring" title="Dashboard SkillPill" description="Ringkasan performa micro-learning."><div className="panel p-6 text-sm text-destructive"><p>{error}</p><Button className="mt-4" onClick={() => void refresh()}>Coba lagi</Button></div></AdminShell>;
  }

  return (
    <AdminShell
      eyebrow="(01) Monitoring"
      title="Dashboard SkillPill"
      description="Kelola katalog, pesanan, pengguna, dan performa SkillPill secara real-time dari satu konsol operator."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <MiniMetric icon={Banknote} label="Pendapatan" value={compactRupiah(totalOmzet)} />
          <MiniMetric icon={ShoppingBag} label="Sales" value={String(totalOrders)} />
          <MiniMetric icon={Layers3} label="Skills" value={String(skills.length)} />
          <Button asChild variant="secondary">
            <Link to="/katalog">Kelola Katalog</Link>
          </Button>
        </div>
      }
    >
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface-2 p-6 shadow-panel sm:p-7">
        <div className="absolute -right-20 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary"><ShieldCheck className="size-3.5" /> Admin Management</span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Ringkasan pengelolaan SkillPill.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Pantau katalog, transaksi, dan aktivitas belajar dari satu tempat.</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-primary"><Activity className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[0.16em]">Status katalog</span></div>
            <p className="mt-2 text-sm font-semibold">Katalog siap dikelola</p>
            <p className="mt-1 text-xs text-muted-foreground">Data terbaru tersedia</p>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Pengguna aktif" value={String(learners.length)} delta="LIVE" note="akun pembelajar" />
        <Kpi label="Pendapatan" value={compactRupiah(totalOmzet)} delta="LIVE" note="akumulasi transaksi paid" highlight />
        <Kpi label="Pesanan selesai" value={totalOrders.toLocaleString("id-ID")} delta="ORDER" note="transaksi berhasil" />
        <Kpi label="SkillPill tayang" value={String(skills.length)} delta="READY" note="siap dipelajari" />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tren Omzet</h2>
            <span className="font-sans font-bold text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Rupiah · 8 bulan
            </span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2 border-b border-border">
            {revenueTrend.map((point, index) => (
              <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-sans font-bold text-[10px] text-muted-foreground">{compactRupiah(point.omzet)}</span>
                <div
                  className={`w-full rounded-t-md ${index === revenueTrend.length - 1 ? "bg-primary" : "bg-primary/35"}`}
                  style={{ height: `${(point.omzet / maxTrend) * 140}px` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {revenueTrend.map((point) => (
              <span
                key={point.month}
                className="flex-1 text-center font-sans font-bold text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                {point.month}
              </span>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Skill Teratas</h2>
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">berdasarkan omzet</span>
          </div>
          <ul className="mt-4 space-y-4">
            {topSkills.map((skill) => (
              <li key={skill.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">{skill.title}</span>
                  <span className="stat-num shrink-0 text-sm text-primary">
                    {compactRupiah(skill.revenue)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(skill.revenue / (topSkills[0]?.revenue || 1)) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 font-sans font-bold text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {skill.orders} transaksi · {skill.label}
                </p>
              </li>
            ))}
            {topSkills.length === 0 && (
              <li className="text-sm text-muted-foreground">Belum ada transaksi paid untuk ditampilkan.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-lg font-semibold">Pesanan Terbaru</h2>
            <span className="font-sans font-bold text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Urutan terbaru
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-y border-border font-sans font-bold text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="px-5 py-2.5 text-left">ID</th>
                  <th className="px-5 py-2.5 text-left">User</th>
                  <th className="px-5 py-2.5 text-left">Skill</th>
                  <th className="px-5 py-2.5 text-left">Status</th>
                  <th className="px-5 py-2.5 text-right">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3 font-sans font-bold text-xs text-muted-foreground">
                      {order.id}
                    </td>
                    <td className="px-5 py-3">{users.find((user) => user.id === order.userId)?.name ?? order.userId}</td>
                    <td className="px-5 py-3 text-muted-foreground">{order.items.map((item) => item.title).join(", ")}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 font-sans font-bold text-[10px] uppercase tracking-[0.14em] ${statusClass[order.status === "paid" ? "Lunas" : order.status === "pending" ? "Pending" : "Gagal"]}`}
                      >
                        {order.status === "paid" ? "Lunas" : order.status === "pending" ? "Pending" : "Refund"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-primary">{rupiah(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Pembelajar Aktif</h2>
          <ul className="mt-4 space-y-3">
            {leaderboard.slice(0, 3).map((learner) => (
              <li key={learner.user.id} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-surface-2 font-sans font-bold text-[11px] text-primary">
                  {learner.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{learner.name}</span>
                  <span className="block font-sans font-bold text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {learner.completedSkills} skill selesai
                  </span>
                </span>
                <span className="stat-num text-sm text-primary">{learner.xp} XP</span>
              </li>
            ))}
            {leaderboard.length === 0 && <li className="text-sm text-muted-foreground">Belum ada aktivitas pembelajar.</li>}
          </ul>
          <Button asChild variant="secondary" className="mt-5 w-full">
            <Link to="/user">Lihat semua user</Link>
          </Button>
        </div>
      </section>
    </AdminShell>
  );
}

function Kpi({
  label,
  value,
  delta,
  note,
  highlight,
}: {
  label: string;
  value: string;
  delta: string;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div className={`panel p-5 ${highlight ? "border-primary/50" : ""}`}>
      <p className="font-sans font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <span className={`stat-num text-3xl ${highlight ? "text-primary" : ""}`}>{value}</span>
        <span className="mb-1 font-sans font-bold text-[11px] text-lime">{delta}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value }: { icon: typeof Banknote; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-sm">
      <span className="grid size-7 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-3.5" /></span>
      <span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        <span className="block text-xs font-bold">{value}</span>
      </span>
    </div>
  );
}
