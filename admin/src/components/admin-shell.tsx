import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BookOpen, LayoutDashboard, LogOut, Moon, ShieldCheck, Sun, Trophy, Users } from "lucide-react";
import { useSkillpill } from "@/lib/skillpill-store";
import { useTheme } from "@/components/theme-provider";
import { useNavigate } from "@tanstack/react-router";
import logoUrl from "../assets/logo.png";

const nav = [
  { to: "/", label: "Dashboard", code: "01", icon: LayoutDashboard },
  { to: "/katalog", label: "Katalog Skill", code: "02", icon: BookOpen },
  { to: "/user", label: "List User", code: "03", icon: Users },
  { to: "/leaderboard", label: "Leaderboard", code: "04", icon: Trophy },
] as const;

export function AdminShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { profile, logout } = useSkillpill();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const operatorName = profile?.name ?? "SkillPill Admin";
  const initials = operatorName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-y-auto border-r border-sidebar-border bg-gradient-to-b from-sidebar via-sidebar to-surface-2/80 px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border/80 bg-surface/70 px-3 py-3 shadow-sm">
          <img src={logoUrl} alt="SkillPill" className="size-11 object-contain" />
          <span className="leading-tight">
            <span className="block font-display text-base font-bold tracking-tight">
              SkillPill
            </span>
            <span className="mt-0.5 block font-sans font-bold text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Micro Commerce
            </span>
          </span>
        </div>

        <nav className="mt-8 flex flex-col gap-1.5">
          <p className="px-3 pb-1 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Workspace
          </p>
          {nav.map(({ icon: Icon, ...item }) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-all hover:border-sidebar-border hover:bg-surface hover:text-foreground data-[status=active]:border-primary/20 data-[status=active]:bg-primary data-[status=active]:text-primary-foreground data-[status=active]:shadow-lg data-[status=active]:shadow-primary/20"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-muted-foreground transition-colors group-data-[status=active]:bg-primary-foreground/15 group-data-[status=active]:text-primary-foreground">
                <Icon className="size-3.5" />
              </span>
              <span className="flex-1">{item.label}</span>
              <span className="text-[9px] opacity-55 group-data-[status=active]:opacity-80">{item.code}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-sidebar-border bg-surface p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <ShieldCheck className="size-3.5" />
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.18em]">Admin aktif</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold">{operatorName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{profile?.email ?? "admin@skillpil.com"}</p>
            </div>
            <button type="button" onClick={() => { logout(); void navigate({ to: "/login", replace: true }); }} aria-label="Keluar dari dashboard" title="Keluar" className="ml-auto rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur">
          <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-6 lg:px-10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                  <ShieldCheck className="size-3" /> Admin Portal
                </span>
                <p className="font-sans font-bold text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
              </div>
              <h1 className="mt-2 text-3xl font-bold">{title}</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Aktifkan light mode" : "Aktifkan night mode"}
                title={isDark ? "Light mode" : "Night mode"}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              {action}
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="whitespace-nowrap rounded-lg px-3 py-2 font-sans font-bold text-[11px] uppercase tracking-[0.14em] text-muted-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
