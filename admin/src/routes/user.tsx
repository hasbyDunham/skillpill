import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { compactRupiah, rupiah } from "@/lib/skillpill-data";
import { type AdminUser, type AdminUserInput, useSkillpill } from "@/lib/skillpill-store";

export const Route = createFileRoute("/user")({
  head: () => ({
    meta: [
      { title: "List User — SkillPill Admin" },
      { name: "description", content: "Kelola akun admin dan user SkillPill dari database yang sama dengan frontend." },
    ],
  }),
  component: UserPage,
});

const emptyForm: AdminUserInput = {
  name: "",
  email: "",
  password: "",
  role: "user",
  plan: "free",
};

function UserPage() {
  const { users, orders, createUser, updateUser, deleteUser } = useSkillpill();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<AdminUserInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.role} ${user.plan}`.toLowerCase().includes(query.toLowerCase()),
  );
  const learners = users.filter((user) => user.role === "user");
  const paidOrders = orders.filter((order) => order.status === "paid");
  const totalSpend = paidOrders.reduce((sum, order) => sum + order.total, 0);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(user: AdminUser) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, plan: user.plan });
    setOpen(true);
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Nama dan email wajib diisi.");
      return;
    }
    if (!editing && (!form.password || form.password.length < 8)) {
      toast.error("Password akun baru minimal 8 karakter.");
      return;
    }
    if (editing && form.password && form.password.length < 8) {
      toast.error("Password baru minimal 8 karakter.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateUser(editing.id, form);
        toast.success(`Akun ${form.name} diperbarui.`);
      } else {
        await createUser({ ...form, password: form.password! });
        toast.success(`Akun ${form.name} ditambahkan.`);
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan akun.");
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(user: AdminUser) {
    if (user.role === "admin") {
      toast.error("Akun admin tidak dapat dihapus.");
      return;
    }
    if (!window.confirm(`Hapus akun ${user.name}? Data akun ini tidak dapat dipulihkan.`)) return;
    try {
      await deleteUser(user.id);
      toast.success(`Akun ${user.name} dihapus.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus akun.");
    }
  }

  return (
    <AdminShell
      eyebrow="(03) User"
      title="List User"
      description="Kelola akun admin dan user yang tersimpan pada database dan digunakan oleh frontend SkillPill."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, email, atau role…"
            className="h-10 w-56 bg-surface-2"
          />
          <Button onClick={openCreate}>+ Tambah Akun</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="User terdaftar" value={String(learners.length)} note="akun learner dari database" />
        <Stat label="Pesanan paid" value={String(paidOrders.length)} note="akumulasi API" />
        <Stat label="Total belanja" value={compactRupiah(totalSpend)} note="transaksi berhasil" />
      </div>

      <div className="panel mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-5 py-3 text-left">Akun</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Bergabung</th>
                <th className="px-5 py-3 text-right">Pesanan</th>
                <th className="px-5 py-3 text-right">Total Belanja</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const userOrders = paidOrders.filter((order) => order.userId === user.id);
                const userSpend = userOrders.reduce((sum, order) => sum + order.total, 0);
                return (
                  <tr key={user.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-full bg-surface-2 font-sans text-[11px] font-bold text-primary">
                          {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                        </span>
                        <span>
                          <span className="block font-medium">{user.name}</span>
                          <span className="block text-xs text-muted-foreground">{user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.12em] ${user.role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 uppercase text-muted-foreground">{user.plan}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(user.joinedAt))}
                    </td>
                    <td className="stat-num px-5 py-3.5 text-right">{userOrders.length}</td>
                    <td className="px-5 py-3.5 text-right text-primary">{rupiah(userSpend)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)} aria-label={`Edit ${user.name}`}>
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={user.role === "admin"}
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => void removeUser(user)}
                          aria-label={`Hapus ${user.name}`}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">Akun tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Akun" : "Tambah Akun"}</DialogTitle>
            <DialogDescription>
              {editing ? "Perbarui data akun. Kosongkan password jika tidak ingin menggantinya." : "Akun tersimpan ke database dan langsung tersedia sesuai role-nya."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Nama">
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </Field>
            <Field label={editing ? "Password baru (opsional)" : "Password"}>
              <Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Role">
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AdminUser["role"] }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <Field label="Plan">
                <select
                  value={form.plan}
                  onChange={(event) => setForm((current) => ({ ...current, plan: event.target.value as AdminUser["plan"] }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={saving} onClick={() => void submit()}>{saving ? "Menyimpan…" : "Simpan Akun"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="panel p-5">
      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="stat-num mt-2 text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
