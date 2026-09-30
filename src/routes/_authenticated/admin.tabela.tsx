import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteStanding, saveStanding, type StandingInput } from "@/lib/admin.functions";
import { contentOptions } from "@/lib/content";
import type { StandingDTO } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/admin/tabela")({
  head: () => ({
    meta: [
      { title: "Tabela — Panel Korner BiH" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TabelaPage,
});

const emptyStanding: StandingInput = {
  team: "",
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  points: 0,
  sortOrder: 99,
  goalsFor: 0,
  goalsAgainst: 0,
  recentForm: "",
};

function num(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function StandingRow({
  standing,
  onSaved,
}: {
  standing: StandingInput;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveStanding);
  const remove = useServerFn(deleteStanding);
  const [form, setForm] = useState(standing);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof StandingInput>(key: K, value: StandingInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);
    try {
      await save({ data: form });
      toast.success("Klub sačuvan.");
      queryClient.invalidateQueries({ queryKey: contentOptions.queryKey });
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Čuvanje nije uspjelo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!window.confirm("Obrisati klub iz tabele?")) return;
    setBusy(true);
    try {
      await remove({ data: { id: form.id } });
      toast.success("Klub obrisan.");
      queryClient.invalidateQueries({ queryKey: contentOptions.queryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Brisanje nije uspjelo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <label className="space-y-1 text-xs text-muted-foreground">Klub
        <Input value={form.team} onChange={(e) => set("team", e.target.value)} placeholder="Naziv kluba" />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">Utakmice
      <Input
        aria-label="Odigrano"
        inputMode="numeric"
        value={form.played}
        onChange={(e) => set("played", num(e.target.value))}
      />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">Pobjede
      <Input
        aria-label="Pobjede"
        inputMode="numeric"
        value={form.wins}
        onChange={(e) => set("wins", num(e.target.value))}
      />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">Remiji
      <Input
        aria-label="Neriješeno"
        inputMode="numeric"
        value={form.draws}
        onChange={(e) => set("draws", num(e.target.value))}
      />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">Porazi
      <Input
        aria-label="Porazi"
        inputMode="numeric"
        value={form.losses}
        onChange={(e) => set("losses", num(e.target.value))}
      />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">Bodovi
      <Input
        aria-label="Bodovi"
        inputMode="numeric"
        value={form.points}
        onChange={(e) => set("points", num(e.target.value))}
      />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">Postignuti golovi
        <Input inputMode="numeric" value={form.goalsFor} onChange={(e) => set("goalsFor", num(e.target.value))} />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">Primljeni golovi
        <Input inputMode="numeric" value={form.goalsAgainst} onChange={(e) => set("goalsAgainst", num(e.target.value))} />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">Forma (W, D, L)
        <Input placeholder="npr. WWDLW" value={form.recentForm} maxLength={5} onChange={(e) => set("recentForm", e.target.value.toUpperCase().replace(/[^WDL]/g, "").slice(-5))} />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">Redoslijed
      <Input
        aria-label="Redoslijed"
        inputMode="numeric"
        value={form.sortOrder}
        onChange={(e) => set("sortOrder", num(e.target.value))}
      />
      </label>
      <div className="flex items-end gap-2">
        <Button size="sm" onClick={handleSave} disabled={busy}>
          Sačuvaj
        </Button>
        {form.id && (
          <Button aria-label="Obriši klub" title="Obriši klub"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={busy}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function TabelaPage() {
  const content = useQuery(contentOptions);
  const [draft, setDraft] = useState<StandingInput | null>(null);

  const standings: StandingDTO[] = content.data?.standings ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Tabela</h1>
        <Button onClick={() => setDraft({ ...emptyStanding })}>
          <Plus className="size-4" /> Dodaj klub
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Manji redoslijed znači više mjesto. Forma: W = pobjeda, D = remi, L = poraz; upiši do pet rezultata od najstarije do najnovije.
      </p>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {standings.map((standing, index) => (
          <StandingRow
            key={standing.id}
            standing={{
              id: standing.id,
              team: standing.team,
              played: standing.played,
              wins: standing.wins,
              draws: standing.draws,
              losses: standing.losses,
              points: standing.points,
              goalsFor: standing.goalsFor,
              goalsAgainst: standing.goalsAgainst,
              recentForm: standing.recentForm,
              sortOrder: index + 1,
            }}
            onSaved={() => content.refetch()}
          />
        ))}

        {draft && (
          <StandingRow
            standing={draft}
            onSaved={() => {
              setDraft(null);
              content.refetch();
            }}
          />
        )}

        {!content.isLoading && standings.length === 0 && !draft && (
          <p className="p-6 text-center text-sm text-muted-foreground">Tabela je prazna.</p>
        )}
      </div>
    </div>
  );
}
