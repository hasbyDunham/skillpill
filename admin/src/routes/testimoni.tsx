import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Star, Trash2, Search, Filter, MessageSquare, Quote, 
  CheckCircle2, AlertTriangle, Sparkles, User, BookOpen, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type AdminReview, useSkillpill } from "@/lib/skillpill-store";

export const Route = createFileRoute("/testimoni")({
  head: () => ({
    meta: [
      { title: "Rating & Testimoni — SkillPill Admin" },
      { 
        name: "description", 
        content: "Monitoring dan moderasi seluruh rating dan ulasan testimoni pembelajar SkillPill." 
      },
    ],
  }),
  component: TestimoniPage,
});

function TestimoniPage() {
  const { reviews: loadedReviews, deleteReview } = useSkillpill();
  const reviews = loadedReviews ?? [];
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [deletingReview, setDeletingReview] = useState<AdminReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const matchQuery = `${r.userName} ${r.userEmail} ${r.skillTitle} ${r.review}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchRating = ratingFilter === "all" || r.rating === ratingFilter;
    return matchQuery && matchRating;
  });

  // Calculate statistics
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
    : "0.0";
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const fiveStarPercent = totalReviews > 0 
    ? Math.round((fiveStarCount / totalReviews) * 100) 
    : 0;

  async function handleConfirmDelete() {
    if (!deletingReview) return;
    setIsDeleting(true);
    try {
      await deleteReview(deletingReview.id);
      toast.success(`Testimoni dari "${deletingReview.userName}" berhasil dihapus.`);
      setDeletingReview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus testimoni.");
    } finally {
      setIsDeleting(false);
    }
  }

  function formatDate(isoString: string) {
    try {
      return new Date(isoString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  }

  return (
    <AdminShell
      eyebrow="(05) Rating & Testimoni"
      title="Ulasan & Testimoni Pembelajar"
      description="Monitoring skor kepuasan dan testimoni dari pengguna yang telah menyelesaikan pembelajaran."
    >
      {/* 1. Metric Stat Panels */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans font-bold text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Total Ulasan
            </span>
            <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="size-4" />
            </span>
          </div>
          <p className="stat-num mt-3 text-3xl font-bold">{totalReviews}</p>
          <p className="mt-1 text-xs text-muted-foreground">Dari seluruh modul skill</p>
        </div>

        <div className="panel p-5 border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="font-sans font-bold text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Rata-Rata Rating
            </span>
            <span className="grid size-8 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
              <Star className="size-4 fill-amber-500" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="stat-num text-3xl font-bold text-amber-500">{avgRating}</p>
            <span className="text-xs text-muted-foreground">/ 5.0</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`size-3 ${
                  s <= Math.round(Number(avgRating))
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans font-bold text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Kepuasan Bintang 5
            </span>
            <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Sparkles className="size-4" />
            </span>
          </div>
          <p className="stat-num mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {fiveStarPercent}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{fiveStarCount} ulasan bintang 5</p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans font-bold text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Moderasi Aktif
            </span>
            <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <p className="stat-num mt-3 text-3xl font-bold text-primary">Real-time</p>
          <p className="mt-1 text-xs text-muted-foreground">Terhubung ke Landing Page</p>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="panel mt-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama user, email, judul skill, atau isi testimoni..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground mr-1">
              <Filter className="size-3.5" /> Filter:
            </span>
            {(["all", 5, 4, 3, 2, 1] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRatingFilter(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  ratingFilter === r
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {r === "all" ? "Semua" : `${r} ★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Review Table / List */}
      <div className="panel mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 font-sans font-bold text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-5 py-3.5">Pembelajar (User)</th>
                <th className="px-5 py-3.5">Skill Dipelajari</th>
                <th className="px-5 py-3.5">Rating</th>
                <th className="px-5 py-3.5 min-w-[240px]">Testimoni / Ulasan</th>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReviews.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-surface-2/40">
                  {/* User Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary font-mono">
                        {item.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground text-xs">{item.userName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{item.userEmail || "Learner"}</p>
                      </div>
                    </div>
                  </td>

                  {/* Skill Column */}
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground truncate max-w-[200px]" title={item.skillTitle}>
                        {item.skillTitle}
                      </p>
                      {item.skillCategory && (
                        <span className="inline-block rounded-md bg-surface-2 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          {item.skillCategory}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Rating Column */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-400">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {item.rating}.0
                      </span>
                    </div>
                  </td>

                  {/* Testimonial Column */}
                  <td className="px-5 py-4">
                    <div className="relative pl-3 border-l-2 border-primary/30 py-0.5">
                      <p className="text-xs italic text-foreground leading-relaxed">
                        "{item.review}"
                      </p>
                    </div>
                  </td>

                  {/* Date Column */}
                  <td className="px-5 py-4 whitespace-nowrap text-muted-foreground text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3 text-muted-foreground/60" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingReview(item)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive size-8 p-0"
                      title="Hapus testimoni"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}

              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    <MessageSquare className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm font-semibold">Tidak ada ulasan atau testimoni ditemukan.</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      {query ? "Coba gunakan kata kunci pencarian yang lain." : "Belum ada testimoni dari pembelajar."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Delete Dialog */}
      <Dialog open={Boolean(deletingReview)} onOpenChange={(open) => !open && setDeletingReview(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Hapus Testimoni Pengguna?
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Testimoni dari pembelajar <strong className="text-foreground">{deletingReview?.userName}</strong> untuk skill{" "}
              <strong className="text-foreground">"{deletingReview?.skillTitle}"</strong> akan dihapus permanen dari halaman Skill.
            </DialogDescription>
          </DialogHeader>

          {deletingReview && (
            <div className="p-3 bg-surface-2 rounded-xl text-xs italic border border-border text-foreground">
              "{deletingReview.review}"
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingReview(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Testimoni"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
