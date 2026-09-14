import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Calendar, MessageSquare, Search, Star, Trash2, User } from "lucide-react";
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
import { type AdminPlatformFeedback, useSkillpill } from "@/lib/skillpill-store";

export const Route = createFileRoute("/feedback")({
  head: () => ({ meta: [{ title: "Masukan Platform — SkillPill Admin" }] }),
  component: PlatformFeedbackPage,
});

function PlatformFeedbackPage() {
  const { platformFeedback: loadedFeedback, deletePlatformFeedback } = useSkillpill();
  const feedback = loadedFeedback ?? [];
  const [query, setQuery] = useState("");
  const [deletingFeedback, setDeletingFeedback] = useState<AdminPlatformFeedback | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredFeedback = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return feedback;
    return feedback.filter((item) =>
      `${item.userName} ${item.userEmail} ${item.feedback}`.toLowerCase().includes(search),
    );
  }, [feedback, query]);

  const averageRating = feedback.length
    ? (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(1)
    : "0.0";

  async function handleDelete() {
    if (!deletingFeedback) return;
    setIsDeleting(true);
    try {
      await deletePlatformFeedback(deletingFeedback.id);
      toast.success(`Masukan dari "${deletingFeedback.userName}" berhasil dihapus.`);
      setDeletingFeedback(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Masukan gagal dihapus.");
    } finally {
      setIsDeleting(false);
    }
  }

  const formatDate = (value: string) => new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <AdminShell
      eyebrow="(08) MASUKAN PLATFORM"
      title="Masukan Pengguna"
      description="Lihat dan kelola rating serta masukan pengguna untuk platform SkillPill."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Total Masukan</span>
            <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary"><MessageSquare className="size-4" /></span>
          </div>
          <p className="stat-num mt-3 text-3xl font-bold">{feedback.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Masukan yang dikirim pengguna.</p>
        </div>
        <div className="panel border-amber-500/20 bg-amber-500/[0.02] p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Rata-Rata Rating</span>
            <span className="grid size-8 place-items-center rounded-xl bg-amber-500/15 text-amber-500"><Star className="size-4 fill-amber-500" /></span>
          </div>
          <p className="stat-num mt-3 text-3xl font-bold text-amber-500">{averageRating}<span className="ml-1 text-sm font-medium text-muted-foreground">/ 5.0</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Berdasarkan seluruh masukan pengguna.</p>
        </div>
      </div>

      <div className="panel mt-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama pengguna, email, atau isi masukan..."
            className="pl-9 text-xs"
          />
        </div>
      </div>

      <div className="panel mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-5 py-3.5">Pengguna</th>
                <th className="px-5 py-3.5">Rating</th>
                <th className="min-w-[300px] px-5 py-3.5">Masukan</th>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFeedback.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-surface-2/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><User className="size-3.5" /></span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{item.userName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{item.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="size-3.5 fill-amber-500" />
                      <span className="font-mono font-bold text-foreground">{item.rating}.0</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><p className="max-w-xl whitespace-pre-wrap leading-relaxed text-foreground">{item.feedback}</p></td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="size-3" />{formatDate(item.createdAt)}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDeletingFeedback(item)} className="size-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" title="Hapus masukan">
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredFeedback.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    <MessageSquare className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                    <p className="text-sm font-semibold">Belum ada masukan pengguna.</p>
                    <p className="mt-1 text-xs">{query ? "Coba gunakan kata kunci lain." : "Masukan baru akan tampil di halaman ini."}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(deletingFeedback)} onOpenChange={(open) => !open && setDeletingFeedback(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="size-5" />Hapus Masukan Pengguna?</DialogTitle>
            <DialogDescription className="pt-1 text-xs">Masukan dari <strong className="text-foreground">{deletingFeedback?.userName}</strong> akan dihapus permanen.</DialogDescription>
          </DialogHeader>
          {deletingFeedback && <p className="rounded-xl border border-border bg-surface-2 p-3 text-xs italic text-foreground">"{deletingFeedback.feedback}"</p>}
          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingFeedback(null)} disabled={isDeleting}>Batal</Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? "Menghapus..." : "Ya, Hapus Masukan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
