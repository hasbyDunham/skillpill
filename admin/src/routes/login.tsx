import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useSkillpill } from "@/lib/skillpill-store";
import logoUrl from "../assets/logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk Admin — SkillPill" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login } = useSkillpill();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) void navigate({ to: "/", replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      await navigate({ to: "/", replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login tidak dapat diproses.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--primary),transparent_48%),linear-gradient(145deg,oklch(0.18_0.055_258),oklch(0.11_0.025_255))] p-12 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="SkillPill" className="size-12 rounded-2xl object-contain" />
          <div>
            <p className="font-display text-xl font-bold">SkillPill</p>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/65">Admin workspace</p>
          </div>
        </div>
        <div className="my-auto max-w-md">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.26em] text-white/65">Operator access</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.06]">Kendalikan platform pembelajaran dengan tenang.</h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-white/75">Pantau katalog, pengguna, pesanan, dan performa SkillPill dari satu dashboard terproteksi.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/8 p-4 text-sm text-white/80 backdrop-blur">
          <ShieldCheck className="size-5 shrink-0 text-sky-200" />
          Sesi login tersimpan aman pada browser perangkat ini.
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <img src={logoUrl} alt="SkillPill" className="size-11 object-contain" />
            <div><p className="font-display text-lg font-bold">SkillPill</p><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Admin workspace</p></div>
          </div>
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Akses operator</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Masuk ke dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">Gunakan akun administrator yang terdaftar pada SkillPill.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-xs font-semibold">Email administrator</span>
              <span className="relative block"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@skillpil.com" className="h-12 w-full rounded-xl border border-input bg-surface pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15" /></span>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold">Password</span>
              <span className="relative block"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input autoComplete="current-password" required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" className="h-12 w-full rounded-xl border border-input bg-surface pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span>
            </label>
            {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive">{error}</p>}
            <button type="submit" disabled={submitting || isLoading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Memverifikasi akun…" : "Masuk ke dashboard"}<ArrowRight className="size-4" />
            </button>
          </form>
          <p className="mt-6 flex items-center gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" /> Token sesi disimpan di browser ini dan diperiksa kembali saat dashboard dibuka.</p>
        </div>
      </section>
    </main>
  );
}
