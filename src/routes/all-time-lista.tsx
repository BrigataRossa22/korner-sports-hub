import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getEternalTable } from "@/lib/eternal.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/all-time-lista")({
  head: () => ({
    meta: [
      { title: "Vječna lista — Korner BiH" },
      { name: "description", content: "Vječna lista klubova: utakmice, pobjede, golovi i bodovi." },
      { property: "og:title", content: "Vječna lista — Korner BiH" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: Vjecna,
});

// Na mobitelu: # i grb ostaju zaglavljeni lijevo, ostalo se klizi udesno
const stickyHead = "sticky z-20 bg-card sm:static sm:bg-transparent";
const stickyCell = "sticky z-10 bg-card sm:static sm:bg-transparent";

function Vjecna() {
  const { data, isLoading } = useQuery({
    queryKey: ["eternal-table"],
    queryFn: () => getEternalTable(),
  });
  const crestFor = useClubCrest();
  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Statistika</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Vječna lista</h1>
      </div>
      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={10} cols={8} />
        </div>
      ) : rows.length === 0 ? (
        <p className="border-y border-border py-8 text-muted-foreground">Lista još nije unesena.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[520px] text-sm tabular-nums sm:min-w-0">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className={`${stickyHead} left-0 w-8 min-w-8 px-1 py-3 text-center sm:px-3 sm:text-left`}>
                  #
                </th>
                <th
                  className={`${stickyHead} left-8 w-10 min-w-10 border-r border-border px-1 py-3 sm:border-r-0 sm:px-3`}
                >
                  <span className="hidden sm:inline">Ekipa</span>
                </th>
                {/* Bod odmah poslije kluba, samo na mobitelu */}
                <th className="w-11 px-1 py-3 text-center sm:hidden">Bod</th>
                <th className="px-1.5 py-3 text-center sm:px-3 sm:text-right">Ut</th>
                <th className="px-1.5 py-3 text-center sm:px-3 sm:text-right">P</th>
                <th className="px-1.5 py-3 text-center sm:px-3 sm:text-right">N</th>
                <th className="px-1.5 py-3 text-center sm:px-3 sm:text-right">I</th>
                <th className="px-2 py-3 text-center sm:px-3 sm:text-right">Golovi</th>
                <th className="px-2 py-3 text-center sm:px-3 sm:text-right">Primljeni</th>
                <th className="px-1.5 py-3 text-center sm:hidden">GR</th>
                <th className="hidden px-3 py-3 text-right sm:table-cell">Bodovi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const crest = crestFor(r.team);
                const gd = r.gf - r.ga;
                return (
                  <tr key={r.team} className="border-t border-border">
                    <td
                      className={`${stickyCell} left-0 w-8 min-w-8 px-1 py-2.5 text-center sm:px-3 sm:py-2 sm:text-left`}
                    >
                      {i + 1}
                    </td>
                    <td
                      className={`${stickyCell} left-8 w-10 min-w-10 border-r border-border px-1 py-2.5 sm:border-r-0 sm:px-3 sm:py-2`}
                    >
                      <Link
                        to="/klub/$name"
                        params={{ name: r.team }}
                        title={r.team}
                        aria-label={r.team}
                        className="flex items-center gap-2 font-medium hover:underline"
                      >
                        {crest ? (
                          <img src={crest} alt="" className="size-7 shrink-0 object-contain sm:size-6" />
                        ) : (
                          <span className="size-7 shrink-0 sm:size-6" />
                        )}
                        <span className="hidden sm:inline">{r.team}</span>
                      </Link>
                    </td>
                    <td className="px-1 py-2.5 text-center font-bold sm:hidden">{r.points}</td>
                    <td className="px-1.5 py-2.5 text-center sm:px-3 sm:py-2 sm:text-right">{r.played}</td>
                    <td className="px-1.5 py-2.5 text-center sm:px-3 sm:py-2 sm:text-right">{r.wins}</td>
                    <td className="px-1.5 py-2.5 text-center sm:px-3 sm:py-2 sm:text-right">{r.draws}</td>
                    <td className="px-1.5 py-2.5 text-center sm:px-3 sm:py-2 sm:text-right">{r.losses}</td>
                    <td className="px-2 py-2.5 text-center sm:px-3 sm:py-2 sm:text-right">{r.gf}</td>
                    <td className="px-2 py-2.5 text-center sm:px-3 sm:py-2 sm:text-right">{r.ga}</td>
                    <td className="px-1.5 py-2.5 text-center sm:hidden">
                      {gd > 0 ? "+" : ""}
                      {gd}
                    </td>
                    <td className="hidden px-3 py-2 text-right font-bold sm:table-cell">{r.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
