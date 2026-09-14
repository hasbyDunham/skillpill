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
          "Monitoring leaderboard pembelajar SkillPill berdasarkan XP dan Skill yang selesai.",
      },
      { property: "og:title", content: "Leaderboard — SkillPill Admin" },
      {
        property: "og:description",
        content: "Peringkat pembelajar SkillPill berdasarkan total XP.",
      },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { leaderboard } = useSkillpill();
  const top = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const maxXp = leaderboard[0]?.xp ?? 1;

  return (
    <AdminShell
      eyebrow="(04) Leaderboard"
      title="Monitoring Leaderboard"
      description="Peringkat pembelajar berdasarkan total XP dari aktivitas belajar yang selesai."
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
                {row.plan === "pro" ? "PRO" : "FREE"}
              </span>
            </div>
            <p className="mt-4 font-display text-lg font-semibold">{row.name}</p>
            <p className="stat-num mt-1 text-3xl text-primary">
              {row.xp.toLocaleString("id-ID")}
              <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">XP</span>
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
              <span>
                <span className="block font-sans font-bold text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Skill selesai
                </span>
                <span className="stat-num text-base">{row.completedSkills}</span>
              </span>
              <span>
                <span className="block font-sans font-bold text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Plan
                </span>
                <span className="stat-num text-base uppercase">{row.plan}</span>
              </span>
            </div>
          </div>
        ))}
        {top.length === 0 && <p className="panel p-5 text-sm text-muted-foreground">Belum ada data pembelajaran.</p>}
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
                    {row.xp.toLocaleString("id-ID")} XP
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(row.xp / maxXp) * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 font-sans font-bold text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {row.plan === "pro" ? "Pro" : "Free"} · {row.completedSkills} skill selesai
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
