import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { deleteFixture, saveFixture, type FixtureInput } from "@/lib/admin.functions";
import { contentOptions } from "@/lib/content";
import type { FixtureDTO } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/admin/raspored")({
  head: () => ({
    meta: [
      { title: "Raspored — Panel Korner BiH" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RasporedPage,
});

const emptyFixture: FixtureInput = {
  comp: "Bh. Telecom Liga",
  home: "",
  away: "",
  when: "",
  scoreHome: null,
  scoreAway: null,
  finished: false,
  sortOrder: 99,
};

function parseScore(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function FixtureRow({
  fixture,
  onSaved,
}: {
  fixture: FixtureInput;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveFixture);
  const remove = useServerFn(deleteFixture);
  const [form, setForm] = useState(fixture);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof FixtureInput>(key: K, value: FixtureInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);
    try {
      await save({ data: form });
      toast.success("Utakmica sačuvana.");
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
    if (!window.confirm("Obrisati utakmicu?")) return;
    setBusy(true);
    try {
      await remove({ data: { id: form.id } });
      toast.success("Utakmica obrisana.");
      queryClient.invalidateQueries({ queryKey: contentOptions.queryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Brisanje nije uspjelo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_0.9fr_auto]">
        <Input
          value={form.comp}
          onChange={(e) => set("comp", e.target.value)}
          placeholder="Takmičenje"
        />
        <Input value={form.home} onChange={(e) => set("home", e.target.value)} placeholder="Domaćin" />
        <Input value={form.away} onChange={(e) => set("away", e.target.value)} placeholder="Gost" />
        <Input
          value={form.when}
          onChange={(e) => set("when", e.target.value)}
          placeholder="Kad, npr. Petak 20:45"
        />
        <div className="flex items-center gap-2">
          <Input
            className="w-16"
            inputMode="numeric"
            value={form.scoreHome ?? ""}
            onChange={(e) => set("scoreHome", parseScore(e.target.value))}
            placeholder="-"
            aria-label="Golovi domaćina"
          />
          <span className="text-muted-foreground">:</span>
          <Input
            className="w-16"
            inputMode="numeric"
            value={form.scoreAway ?? ""}
            onChange={(e) => set("scoreAway", parseScore(e.target.value))}
            placeholder="-"
            aria-label="Golovi gosta"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={form.finished} onCheckedChange={(v) => set("finished", v)} />
          Završeno
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Redoslijed
          <Input
            className="w-20"
            inputMode="numeric"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
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
    </div>
  );
}

function RasporedPage() {
  const content = useQuery(contentOptions);
  const [draft, setDraft] = useState<FixtureInput | null>(null);

  const fixtures: FixtureDTO[] = content.data?.fixtures ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Raspored</h1>
        <Button onClick={() => setDraft({ ...emptyFixture })}>
          <Plus className="size-4" /> Dodaj utakmicu
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Ostavi rezultat prazan za utakmice koje se još igraju.
      </p>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {fixtures.map((fixture) => (
          <FixtureRow
            key={fixture.id}
            fixture={{
              id: fixture.id,
              comp: fixture.comp,
              home: fixture.home,
              away: fixture.away,
              when: fixture.when,
              scoreHome: fixture.scoreHome,
              scoreAway: fixture.scoreAway,
              finished: fixture.finished,
              sortOrder: 0,
            }}
            onSaved={() => undefined}
          />
        ))}

        {draft && (
          <FixtureRow
            fixture={draft}
            onSaved={() => {
              setDraft(null);
              content.refetch();
            }}
          />
        )}

        {!content.isLoading && fixtures.length === 0 && !draft && (
          <p className="p-6 text-center text-sm text-muted-foreground">Nema utakmica.</p>
        )}
      </div>
    </div>
  );
}
