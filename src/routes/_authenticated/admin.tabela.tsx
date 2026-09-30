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
    <div className="grid gap-3 p-4 sm:grid-cols-[1.4fr_repeat(6,70px)_auto]">
      <Input value={form.team} onChange={(e) => set("team", e.target.value)} placeholder="Klub" />
      <Input
        aria-label="Odigrano"
        inputMode="numeric"
        value={form.played}
        onChange={(e) => set("played", num(e.target.value))}
      />
      <Input
        aria-label="Pobjede"
        inputMode="numeric"
        value={form.wins}
        onChange={(e) => set("wins", num(e.target.value))}
      />
      <Input
        aria-label="Neriješeno"
        inputMode="numeric"
        value={form.draws}
        onChange={(e) => set("draws", num(e.target.value))}
      />
      <Input
        aria-label="Porazi"
        inputMode="numeric"
        value={form.losses}
        onChange={(e) => set("losses", num(e.target.value))}
      />
      <Input
        aria-label="Bodovi"
        inputMode="numeric"
        value={form.points}
        onChange={(e) => set("points", num(e.target.value))}
      />
      <Input
        aria-label="Redoslijed"
        inputMode="numeric"
        value={form.sortOrder}
        onChange={(e) => set("sortOrder", num(e.target.value))}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={busy}>
          Sačuvaj
        </Button>
        {form.id && (
          <Button
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
        Manji broj u koloni <strong>Redoslijed</strong> znači više mjesto na tabeli.
      </p>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        <div className="hidden grid-cols-[1.4fr_repeat(6,70px)_auto] gap-3 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground sm:grid">
          <span>Klub</span>
          <span>Odig</span>
          <span>Pob</span>
          <span>Ner</span>
          <span>Por</span>
          <span>Bod</span>
          <span>Red</span>
          <span />
        </div>

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
