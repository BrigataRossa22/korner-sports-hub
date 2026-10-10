import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getSeasonWinners } from "@/lib/winners.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/pobjednici")({
  head: () => ({
    meta: [
      { title: "Pobjednici — Korner BiH" },
      { name: "description", content: "Pobjednici Premijer lige BiH po sezonama: prvak, drugi, treći i najbolji strijelac." },
    ],
  }),
  errorComponent: LoadError,
  component: Pobjednici,
});

function Pobjednici() {
  const { data, isLoading } = useQuery({
    queryKey: ["season-winners"],
    queryFn: () => getSeasonWinners(),
  });
  const crestFor = useClubCrest();
  const rows = data ?? [];

  const Club = ({ name, bold }: { name: string; bold?: boolean }) => {
    if (!name) return <span className="text-muted-foreground">—</span>;
    const c = crestFor(name);
    return (
      <span className={`flex items-center gap-2 ${bold ? "font-bold" : "font-medium"}`}>
        {c ? <img src={c} alt="" className="size-6 shrink-0 object-contain" /> : <span className="size-6 shrink-0" />}
        {name}
      </span>
    );
  };

  const Scorer = ({ name, club }: { name: string; club: string }) => {
    if (!name) return <span className="text-muted-foreground">—</span>;
    const c = club ? crestFor(club) : "";
    return (
      <span className="flex items-center gap-2 font-medium" title={club || undefined}>
        {c ? <img src={c} alt="" className="size-6 shrink-0 object-contain" /> : <span className="size-6 shrink-0" />}
        {name}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Statistika</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Pobjednici</h1>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={10} cols={6} />
        </div>
      ) : rows.length === 0 ? (
        <p className="border-y border-border py-8 text-muted-foreground">Još nema podataka.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm tabular-nums">
            <thead>
              <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                <th className="px-3 py-3 text-left">Sezona</th>
                <th className="px-3 py-3 text-left">Prvak</th>
                <th className="px-3 py-3 text-left">Drugo mjesto</th>
                <th className="px-3 py-3 text-left">Treće mjesto</th>
                <th className="px-3 py-3 text-left">Najbolji strijelac</th>
                <th className="px-3 py-3 text-right">Golova</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-3 font-semibold">{r.season}</td>
                  <td className="px-3 py-3"><Club name={r.champion} bold /></td>
                  <td className="px-3 py-3"><Club name={r.second} /></td>
                  <td className="px-3 py-3"><Club name={r.third} /></td>
                  <td className="px-3 py-3"><Scorer name={r.top_scorer} club={r.scorer_club} /></td>
                  <td className="px-3 py-3 text-right font-bold">{r.goals > 0 ? r.goals : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
