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
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[660px] border-collapse text-sm tabular-nums">
        <thead>
          <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
            <th scope="col" className="w-10 px-2 py-3 text-center font-semibold">#</th>
            <th scope="col" className="min-w-36 px-2 py-3 text-left font-semibold">Klub</th>
            <th scope="col" className="w-10 px-1 py-3 text-center font-semibold" title="Odigrano">Ut</th>
            <th scope="col" className="w-10 px-1 py-3 text-center font-semibold" title="Pobjede">P</th>
            <th scope="col" className="w-10 px-1 py-3 text-center font-semibold" title="Neriješeno">N</th>
            <th scope="col" className="w-10 px-1 py-3 text-center font-semibold" title="Porazi">I</th>
            <th scope="col" className="w-16 px-1 py-3 text-center font-semibold" title="Postignuti i primljeni golovi">Golovi</th>
            <th scope="col" className="w-12 px-1 py-3 text-center font-semibold" title="Gol-razlika">GR</th>
            <th scope="col" className="w-36 px-1 py-3 text-center font-semibold">Forma</th>
            <th scope="col" className="w-12 px-2 py-3 text-center font-semibold" title="Bodovi">Bod</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => {
            const knownGoals = row.played === 0 || row.goalsFor !== 0 || row.goalsAgainst !== 0;
            const crest = crestFor(row.team) || row.crest;
            return (
              <tr key={row.id} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                <td className="px-2 py-3 text-center font-semibold text-primary">{index + 1}</td>
                <th scope="row" className="px-2 py-3 text-left font-semibold text-foreground">
                  <span className="flex items-center gap-2">
                    {crest ? (
                      <img src={crest} alt="" className="size-6 shrink-0 object-contain" />
                    ) : (
                      <span className="size-6 shrink-0" />
                    )}
                    {row.team}
                  </span>
                </th>
                <td className="px-1 py-3 text-center">{row.played}</td>
                <td className="px-1 py-3 text-center">{row.wins}</td>
                <td className="px-1 py-3 text-center">{row.draws}</td>
                <td className="px-1 py-3 text-center">{row.losses}</td>
                <td className="px-1 py-3 text-center">{knownGoals ? `${row.goalsFor}:${row.goalsAgainst}` : "—"}</td>
                <td className="px-1 py-3 text-center">{knownGoals ? (row.goalsFor - row.goalsAgainst > 0 ? "+" : "") + (row.goalsFor - row.goalsAgainst) : "—"}</td>
                <td className="px-1 py-3">
                  <div className="flex items-center justify-center gap-1" aria-label={row.recentForm ? `Forma: ${row.recentForm}` : "Forma nije unesena"}>
                    {row.recentForm ? row.recentForm.slice(-5).split("").map((result, i) => (
                      <span key={i} title={result === "W" ? "Pobjeda" : result === "D" ? "Neriješeno" : "Poraz"} className={`flex size-5 items-center justify-center rounded-sm text-[11px] font-bold ${resultStyle[result] ?? "bg-muted text-muted-foreground"}`}>{result}</span>
                    )) : <span className="text-muted-foreground">—</span>}
                  </div>
                </td>
                <td className="px-2 py-3 text-center font-bold text-primary">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
