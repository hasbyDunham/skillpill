import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type SkillpillPlan, useSkillpill } from "@/lib/skillpill-store";

export const Route = createFileRoute("/plan")({
  component: ManagePlanPage,
});

function PlanForm({ plan }: { plan: SkillpillPlan }) {
  const { updatePlan } = useSkillpill();
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.price));
  const [benefits, setBenefits] = useState(plan.benefits.join("\n"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(plan.name);
    setPrice(String(plan.price));
    setBenefits(plan.benefits.join("\n"));
  }, [plan]);

  async function save() {
    setSaving(true);
    try {
      await updatePlan(plan.key, {
        name: name.trim() || plan.name,
        price: plan.key === "free" ? 0 : Math.max(0, Number(price) || 0),
        benefits: benefits.split("\n").map((item) => item.trim()).filter(Boolean),
      });
      toast.success(`Paket ${plan.key === "free" ? "Free" : "Pro"} berhasil disimpan.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Paket gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  const isFree = plan.key === "free";

  return (
    <section className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Paket {isFree ? "Gratis" : "Premium"}
          </span>
          <h2 className="mt-1 text-xl font-semibold">{isFree ? "Plan Free" : "Plan Pro"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFree ? "Paket default untuk semua akun baru." : "User harus upgrade ke paket ini sebelum membeli Skill khusus Pro."}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {plan.isActive ? "Aktif" : "Tidak aktif"}
        </span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${plan.key}-name`}>Nama paket</Label>
          <Input id={`${plan.key}-name`} value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${plan.key}-price`}>Harga (Rupiah)</Label>
          <Input
            id={`${plan.key}-price`}
            type="number"
            min={0}
            step={1000}
            value={isFree ? "0" : price}
            disabled={isFree}
            onChange={(event) => setPrice(event.target.value)}
          />
          {isFree && <p className="text-xs text-muted-foreground">Harga Plan Free selalu Rp0.</p>}
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <Label htmlFor={`${plan.key}-benefits`}>Benefit paket (satu benefit per baris)</Label>
        <Textarea
          id={`${plan.key}-benefits`}
          rows={6}
          value={benefits}
          onChange={(event) => setBenefits(event.target.value)}
        />
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="button" onClick={save} disabled={saving}>
          <Save className="mr-2 size-4" />
          {saving ? "Menyimpan..." : "Simpan Paket"}
        </Button>
      </div>
    </section>
  );
}

function ManagePlanPage() {
  const { plans } = useSkillpill();
  const planByKey = new Map(plans.map((plan) => [plan.key, plan]));

  return (
    <AdminShell
      eyebrow="(06) MANAGE PLAN"
      title="Manage Plan"
      description="Atur harga dan benefit paket Free serta Pro untuk pembelajar."
    >
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>Skill khusus Pro tetap dibeli secara terpisah setelah user berhasil upgrade ke Plan Pro.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {(["free", "pro"] as const).map((key) => {
          const plan = planByKey.get(key);
          return plan ? <PlanForm key={key} plan={plan} /> : (
            <div key={key} className="panel p-6 text-sm text-muted-foreground">
              <CheckCircle2 className="mb-3 size-5 text-primary" /> Memuat paket {key}...
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
