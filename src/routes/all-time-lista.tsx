import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { getAllTime, type AllTimeRow } from "@/lib/alltime.functions";

export const Route = createFileRoute("/all-time-lista")({
  head: () => ({
    meta: [
      { title: "All-time lista — Korner BiH" },
      { name: "description", content: "All-time lista: najbolji svih vremena." },
      { property: "og:title", content: "All-time lista — Korner BiH" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: AllTime,
});

function Board({ title, rows }: { title: string; rows: AllTimeRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-bold uppercase">
        {title}
      </h2>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.id} className="border-t border-border first:border-t-0">
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
    </div>
  );
}

function AllTime() {
  const { data } = useQuery({ queryKey: ["all-time"], queryFn: () => getAllTime() });
  const rows = data ?? [];
  const groups = new Map<string, AllTimeRow[]>();
  for (const r of rows) {
    groups.set(r.category, [...(groups.get(r.category) ?? []), r]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Historija</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">All-time lista</h1>
      </div>
      {groups.size === 0 ? (
        <p className="border-y border-border py-8 text-muted-foreground">Lista još nije unesena.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {[...groups.entries()].map(([title, list]) => (
            <Board key={title} title={title} rows={list} />
          ))}
        </div>
      )}
    </div>
  );
}
