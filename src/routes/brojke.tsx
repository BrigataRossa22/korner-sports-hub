import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getBrojke, type TopRow } from "@/lib/brojke.functions";

export const Route = createFileRoute("/brojke")({
  head: () => ({ meta: [{ title: "Brojke — Korner BiH" }] }),
  component: BrojkePage,
});

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

function TopTable({ title, unit, rows }: { title: string; unit: string; rows: TopRow[] }) {
  const ranked = withRank(rows);
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <h2 className="border-b border-border bg-surface px-4 py-3 font-display text-lg font-bold uppercase">
        {title}
      </h2>
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
            {ranked.map((r, i) => (
              <tr key={`${r.name}-${i}`} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                <td className={`px-3 py-2.5 text-center font-semibold ${r.rank <= 3 ? "text-primary" : ""}`}>
                  {r.rank}
                </td>
                <td className={`px-2 py-2.5 font-semibold ${r.rank <= 3 ? "text-primary" : ""}`}>{r.name}</td>
                <td className="px-3 py-2.5 text-right text-base font-bold">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function BrojkePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["brojke-v1"],
    queryFn: () => getBrojke(),
    staleTime: 60 * 60 * 1000,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Statistika</p>
      <h1 className="font-display text-3xl font-bold uppercase">Brojke</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Svi ligaški golovi i asistencije od 2002-03 do 2026-27
        {data
          ? ` · u obračunu ${data.seasons.length} ${data.seasons.length === 1 ? "sezona" : "sezona"}, ${data.goalsTotal} golova`
          : ""}
      </p>

      {isLoading || !data ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={10} cols={3} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <TopTable title="Top 25 strijelaca" unit="Golova" rows={data.scorers} />
          <TopTable title="Top 25 asistenata" unit="Asistencija" rows={data.assists} />
        </div>
      )}
    </main>
  );
}
