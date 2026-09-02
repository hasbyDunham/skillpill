import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useSkillpill } from "@/lib/skillpill-store";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — SkillPill Admin" },
      {
        name: "description",
        content:
          "Monitoring leaderboard pembelajar SkillPill: pil selesai, streak harian, dan total poin.",
      },
      { property: "og:title", content: "Leaderboard — SkillPill Admin" },
      {
        property: "og:description",
        content: "Peringkat pembelajar SkillPill berdasarkan poin dan streak.",
      },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { leaderboard } = useSkillpill();
  const top = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const maxPoints = leaderboard[0]?.points ?? 1;

  return (
    <AdminShell
      eyebrow="(04) Leaderboard"
      title="Monitoring Leaderboard"
      description="Peringkat pembelajar aktif berdasarkan pil yang diselesaikan, streak, dan poin."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {top.map((row) => (
          <div
            key={row.rank}
            className={`panel p-5 ${row.rank === 1 ? "border-gold/50 bg-surface-2" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`stat-num text-2xl ${row.rank === 1 ? "text-gold" : "text-primary"}`}
              >
                #{row.rank}
              </span>
              <span className="font-sans font-bold text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {row.cohort}
              </span>
            </div>
            <p className="mt-4 font-display text-lg font-semibold">{row.name}</p>
            <p className="stat-num mt-1 text-3xl text-primary">
              {row.points.toLocaleString("id-ID")}
              <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">poin</span>
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
              <span>
                <span className="block font-sans font-bold text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Pil selesai
                </span>
                <span className="stat-num text-base">{row.pills}</span>
              </span>
              <span>
                <span className="block font-sans font-bold text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Streak
                </span>
                <span className="stat-num text-base">{row.streak} hari</span>
              </span>
            </div>
          </div>
        ))}
        {top.length === 0 && <p className="panel p-5 text-sm text-muted-foreground">Belum ada data pembelajaran dari API.</p>}
      </div>

      <div className="panel mt-6 p-5">
        <h2 className="text-lg font-semibold">Peringkat lengkap</h2>
        <ul className="mt-4 space-y-3">
          {rest.map((row) => (
            <li key={row.rank} className="flex items-center gap-4">
              <span className="stat-num w-8 text-muted-foreground">#{row.rank}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">{row.name}</span>
                  <span className="stat-num shrink-0 text-sm text-primary">
                    {row.points.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(row.points / maxPoints) * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 font-sans font-bold text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {row.cohort} · {row.pills} pil · streak {row.streak} hari
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
