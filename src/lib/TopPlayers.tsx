import { useQuery } from "@tanstack/react-query";
import { getPlayerStats, type PlayerStat } from "@/lib/players.functions";

function Board({ title, label, rows }: { title: string; label: string; rows: PlayerStat[] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Još nema podataka.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2">#</th>
              <th className="py-2">Igrač</th>
              <th className="px-4 py-2 text-right">{label}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-2">{i + 1}</td>
                <td className="py-2">
                  <span className="font-medium">{p.name}</span>
                  {p.team && <span className="ml-2 text-xs text-muted-foreground">{p.team}</span>}
                </td>
                <td className="px-4 py-2 text-right font-semibold">{p.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function TopPlayers() {
  const { data } = useQuery({ queryKey: ["player-stats"], queryFn: () => getPlayerStats() });
  const all = data ?? [];
  return (
    <section className="mt-10 grid gap-6 md:grid-cols-2">
      <Board title="Strijelci" label="Golovi" rows={all.filter((p) => p.kind === "scorer").slice(0, 10)} />
      <Board title="Asistenti" label="Asistencije" rows={all.filter((p) => p.kind === "assist").slice(0, 10)} />
    </section>
  );
}
