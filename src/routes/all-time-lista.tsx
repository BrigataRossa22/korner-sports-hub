import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { getAllTimeTeams } from "@/lib/alltimeteams.functions";

export const Route = createFileRoute("/all-time-lista")({
  head: () => ({
    meta: [
      { title: "All-time lista — Korner BiH" },
      { name: "description", content: "All-time lista klubova: utakmice, pobjede, golovi i bodovi." },
      { property: "og:title", content: "All-time lista — Korner BiH" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: AllTime,
});

function AllTime() {
  const { data } = useQuery({ queryKey: ["all-time-teams"], queryFn: () => getAllTimeTeams() });
  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Historija</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">All-time lista</h1>
      </div>
      {rows.length === 0 ? (
        <p className="border-y border-border py-8 text-muted-foreground">Lista još nije unesena.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Ekipa</th>
                <th className="px-3 py-3 text-right">Ut</th>
                <th className="px-3 py-3 text-right">P</th>
                <th className="px-3 py-3 text-right">N</th>
                <th className="px-3 py-3 text-right">I</th>
                <th className="px-3 py-3 text-right">Golovi</th>
                <th className="px-3 py-3 text-right">Primljeni</th>
                <th className="px-3 py-3 text-right">Bodovi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 font-medium">
                      {r.crest ? (
                        <img src={r.crest} alt="" className="size-6 object-contain" />
                      ) : (
                        <span className="size-6" />
                      )}
                      {r.team}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{r.played}</td>
                  <td className="px-3 py-2 text-right">{r.wins}</td>
                  <td className="px-3 py-2 text-right">{r.draws}</td>
                  <td className="px-3 py-2 text-right">{r.losses}</td>
                  <td className="px-3 py-2 text-right">{r.goals_for}</td>
                  <td className="px-3 py-2 text-right">{r.goals_against}</td>
                  <td className="px-3 py-2 text-right font-bold">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
