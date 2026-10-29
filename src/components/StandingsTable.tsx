import { Link } from "@tanstack/react-router";
import type { StandingDTO } from "@/lib/content.functions";
import { useCrest } from "@/lib/use-crest";

const resultStyle: Record<string, string> = {
  W: "bg-primary text-primary-foreground",
  D: "bg-muted text-muted-foreground",
  L: "bg-destructive text-destructive-foreground",
};

export function StandingsTable({ standings }: { standings: StandingDTO[] }) {
  const crestFor = useCrest();
  return (
    <div className="border-y border-border sm:overflow-x-auto">
      <table className="w-full border-collapse text-sm tabular-nums sm:min-w-[660px]">
        <thead>
          <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
            <th scope="col" className="w-8 px-1 py-3 text-center font-semibold sm:w-10 sm:px-2">#</th>
            <th scope="col" className="px-1 py-3 text-left font-semibold sm:min-w-36 sm:px-2">
              <span className="hidden sm:inline">Klub</span>
            </th>
            <th scope="col" className="w-9 px-0.5 py-3 text-center font-semibold sm:w-10 sm:px-1" title="Odigrano">Ut</th>
            <th scope="col" className="w-9 px-0.5 py-3 text-center font-semibold sm:w-10 sm:px-1" title="Pobjede">P</th>
            <th scope="col" className="w-9 px-0.5 py-3 text-center font-semibold sm:w-10 sm:px-1" title="Neriješeno">N</th>
            <th scope="col" className="w-9 px-0.5 py-3 text-center font-semibold sm:w-10 sm:px-1" title="Porazi">I</th>
            <th scope="col" className="hidden w-16 px-1 py-3 text-center font-semibold sm:table-cell" title="Postignuti i primljeni golovi">Golovi</th>
            <th scope="col" className="w-10 px-0.5 py-3 text-center font-semibold sm:w-12 sm:px-1" title="Gol-razlika">GR</th>
            <th scope="col" className="hidden w-36 px-1 py-3 text-center font-semibold sm:table-cell">Forma</th>
            <th scope="col" className="w-10 px-1 py-3 text-center font-semibold sm:w-12 sm:px-2" title="Bodovi">Bod</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => {
            const knownGoals = row.played === 0 || row.goalsFor !== 0 || row.goalsAgainst !== 0;
            const crest = crestFor(row.team) || row.crest;
            return (
              <tr key={row.id} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                <td className="px-1 py-2.5 text-center font-semibold text-primary sm:px-2 sm:py-3">{index + 1}</td>
                <th scope="row" className="px-1 py-2.5 text-left font-semibold text-foreground sm:px-2 sm:py-3">
                  <Link
                    to="/klub/$name"
                    params={{ name: row.team }}
                    title={row.team}
                    aria-label={row.team}
                    className="flex items-center gap-2 hover:underline"
                  >
                    {crest ? (
                      <img src={crest} alt="" className="size-7 shrink-0 object-contain sm:size-6" />
                    ) : (
                      <span className="size-7 shrink-0 sm:size-6" />
                    )}
                    <span className="hidden sm:inline">{row.team}</span>
                  </Link>
                </th>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{row.played}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{row.wins}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{row.draws}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{row.losses}</td>
                <td className="hidden px-1 py-3 text-center sm:table-cell">{knownGoals ? `${row.goalsFor}:${row.goalsAgainst}` : "—"}</td>
                <td className="px-0.5 py-2.5 text-center sm:px-1 sm:py-3">{knownGoals ? (row.goalsFor - row.goalsAgainst > 0 ? "+" : "") + (row.goalsFor - row.goalsAgainst) : "—"}</td>
                <td className="hidden px-1 py-3 sm:table-cell">
                  <div className="flex items-center justify-center gap-1" aria-label={row.recentForm ? `Forma: ${row.recentForm}` : "Forma nije unesena"}>
                    {row.recentForm ? row.recentForm.slice(-5).split("").map((result, i) => (
                      <span key={i} title={result === "W" ? "Pobjeda" : result === "D" ? "Neriješeno" : "Poraz"} className={`flex size-5 items-center justify-center rounded-sm text-[11px] font-bold ${resultStyle[result] ?? "bg-muted text-muted-foreground"}`}>{result}</span>
                    )) : <span className="text-muted-foreground">—</span>}
                  </div>
                </td>
                <td className="px-1 py-2.5 text-center font-bold text-primary sm:px-2 sm:py-3">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
