import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, Save } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSkillpill } from "@/lib/skillpill-store";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { contactSettings, updateContactSettings } = useSkillpill();
  const [email, setEmail] = useState(contactSettings.email ?? "");
  const [phone, setPhone] = useState(contactSettings.phone ?? "");
  const [address, setAddress] = useState(contactSettings.address ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEmail(contactSettings.email ?? "");
    setPhone(contactSettings.phone ?? "");
    setAddress(contactSettings.address ?? "");
  }, [contactSettings]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await updateContactSettings({
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
      toast.success("Informasi kontak berhasil disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Informasi kontak gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminShell
      eyebrow="(07) HUBUNGI KAMI"
      title="Hubungi Kami"
      description="Atur informasi kontak dan alamat tujuan pesan dari Beranda SkillPill."
    >
      <form onSubmit={handleSubmit} className="panel mx-auto max-w-3xl p-6 sm:p-8">
        <div className="mb-7">
          <h2 className="text-lg font-semibold">Informasi Kontak</h2>
          <p className="mt-1 text-sm text-muted-foreground">Email tujuan digunakan untuk menerima pesan dari formulir Hubungi Kami.</p>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="contact-email" className="flex items-center gap-2"><Mail className="size-4 text-primary" /> Email tujuan</Label>
            <Input id="contact-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@perusahaan.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-phone" className="flex items-center gap-2"><Phone className="size-4 text-primary" /> Nomor telepon</Label>
            <Input id="contact-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+62 812 3456 7890" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-address" className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Alamat</Label>
            <Textarea id="contact-address" rows={4} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Alamat kantor atau lokasi layanan" />
          </div>
        </div>

        <div className="mt-7 flex justify-end">
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 size-4" />
            {isSaving ? "Menyimpan..." : "Simpan Kontak"}
          </Button>
        </div>
      </form>
    </AdminShell>
  );
}
