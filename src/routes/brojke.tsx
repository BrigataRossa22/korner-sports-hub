import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getBrojke, type TopRow } from "@/lib/brojke.functions";
import { getPlayerGoals } from "@/lib/playergoals.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/brojke")({
  head: () => ({ meta: [{ title: "Brojke — Korner BiH" }] }),
  component: BrojkePage,
});

type Mode = "liga" | "kup";

// Mjesto u tabeli: isti broj = isto mjesto
function withRank(rows: TopRow[]) {
  let rank = 0;
  let prev = -1;
  return rows.map((r, i) => {
    if (r.count !== prev) {
      rank = i + 1;
      prev = r.count;
    }
    return { ...r, rank };
  });
}

// Grbovi svih klubova za koje je igrač postigao gol (ili asistirao), redom kako je mijenjao klubove
function ClubCrests({ clubs, crestFor }: { clubs: string[]; crestFor: (club: string) => string }) {
  const seen = new Set<string>();
  const items: { src: string; name: string }[] = [];
  for (const c of clubs) {
    const src = crestFor(c);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    items.push({ src, name: c });
  }
  if (items.length === 0) return null;
  return (
    <span className="flex items-center gap-1">
      {items.map((it) => (
        <img key={it.src} src={it.src} alt={it.name} title={it.name} className="size-5 shrink-0 object-contain" />
      ))}
    </span>
  );
}

// Svi golovi jednog igrača (otvara se klikom na ime)
function PlayerGoalsList({ name }: { name: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["player-goals", name],
    queryFn: () => getPlayerGoals({ data: { name } }),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) return <p className="py-3 text-center text-sm text-muted-foreground">Učitavam golove…</p>;
  if (!data || data.length === 0)
    return <p className="py-3 text-center text-sm text-muted-foreground">Nema podataka o golovima.</p>;

  const pens = data.filter((g) => g.penalty).length;

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        {data.length} golova{pens > 0 ? `, od toga ${pens} iz penala` : ""}
      </p>
      <div className="max-h-96 overflow-auto rounded-md border border-border bg-card">
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead>
            <tr className="sticky top-0 border-b border-border bg-surface text-xs uppercase text-muted-foreground">
              <th className="px-3 py-2 text-left">Sezona</th>
              <th className="px-2 py-2 text-center">Kolo</th>
              <th className="px-2 py-2 text-left">Utakmica</th>
              <th className="px-3 py-2 text-right">Minut</th>
            </tr>
          </thead>
          <tbody>
            {data.map((g, i) => {
              const homeScored = g.team && g.team === g.home;
              const awayScored = g.team && g.team === g.away;
              return (
                <tr key={i} className="border-b border-border/70 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2">{g.season}</td>
                  <td className="px-2 py-2 text-center text-muted-foreground">{g.round ?? "—"}</td>
                  <td className="px-2 py-2">
                    <span className={homeScored ? "font-semibold" : ""}>{g.home}</span>
                    <span className="text-muted-foreground"> – </span>
                    <span className={awayScored ? "font-semibold" : ""}>{g.away}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {g.minute != null ? `${g.minute}${g.extra ? `+${g.extra}` : ""}'` : "—"}
                    {g.penalty && <span className="ml-1 text-xs text-muted-foreground">(p)</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopTable({
  title,
  unit,
  rows,
  tabs,
  expandable,
}: {
  title: string;
  unit: string;
  rows: TopRow[];
  tabs?: React.ReactNode;
  expandable?: boolean;
}) {
  const ranked = withRank(rows);
  const crestFor = useClubCrest();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3">
        <h2 className="font-display text-lg font-bold uppercase">{title}</h2>
        {tabs}
      </div>
      {ranked.length === 0 ? (
        <p className="px-4 py-8 text-center text-muted-foreground">Još nema podataka.</p>
      ) : (
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
              <th className="w-12 px-3 py-2 text-center">#</th>
              <th className="px-2 py-2 text-left">Igrač</th>
              <th className="w-24 px-3 py-2 text-right">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => {
              const isOpen = !!expandable && open === r.name;
              return (
                <Fragment key={`${r.name}-${i}`}>
                  <tr
                    onClick={expandable ? () => setOpen(isOpen ? null : r.name) : undefined}
                    className={`border-b border-border/70 last:border-0 even:bg-surface/50 ${
                      expandable ? "cursor-pointer hover:bg-muted/60" : ""
                    }`}
                  >
                    <td className={`px-3 py-2.5 text-center font-semibold ${r.rank <= 3 ? "text-primary" : ""}`}>
                      {r.rank}
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className={`font-semibold ${r.rank <= 3 ? "text-primary" : ""}`}>{r.name}</span>
                        <ClubCrests clubs={r.clubs} crestFor={crestFor} />
                        {expandable && (
                          <span className="text-xs text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-base font-bold">{r.count}</td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-border/70 bg-surface/40">
                      <td colSpan={3} className="px-3 py-3">
                        <PlayerGoalsList name={r.name} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

function BrojkePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["brojke-v3"],
    queryFn: () => getBrojke(),
    staleTime: 60 * 60 * 1000,
  });
  const [mode, setMode] = useState<Mode>("liga");

  const tabs = (
    <div className="flex gap-1">
      {(["liga", "kup"] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
            mode === m ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
          }`}
        >
          {m === "liga" ? "Liga" : "Kup BiH"}
        </button>
      ))}
    </div>
  );

  const cupFrom = data?.cupSeasons[0];
  const cupTo = data?.cupSeasons[data.cupSeasons.length - 1];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Statistika</p>
      <h1 className="font-display text-3xl font-bold uppercase">Brojke</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        {mode === "liga"
          ? "Svi ligaški golovi i asistencije od 2002-03 do 2026-27 · klikni na igrača da vidiš sve njegove golove"
          : "Svi golovi u Kupu BiH"}
        {data
          ? mode === "liga"
            ? ` · u obračunu ${data.seasons.length} ${data.seasons.length === 1 ? "sezona" : "sezona"}, ${data.goalsTotal} golova`
            : cupFrom && cupTo
              ? ` · sezone ${cupFrom === cupTo ? cupFrom : `${cupFrom} do ${cupTo}`}, ${data.cupGoalsTotal} golova`
              : ""
          : ""}
      </p>

      {isLoading || !data ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={10} cols={3} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <TopTable
            title={mode === "liga" ? "Top 25 strijelaca · Liga" : "Top 25 strijelaca · Kup BiH"}
            unit="Golova"
            rows={mode === "liga" ? data.scorers : data.cupScorers}
            tabs={tabs}
            expandable={mode === "liga"}
          />
          <TopTable title="Top 25 asistenata · Liga" unit="Asistencija" rows={data.assists} />
        </div>
      )}
    </main>
  );
}
