import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getAllTimeTeams } from "@/lib/alltimeteams.functions";
import { getBrojke, type TopRow } from "@/lib/brojke.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/klubovi")({
  head: () => ({
    meta: [
      { title: "Klubovi — Korner BiH" },
      { name: "description", content: "Svi klubovi Premijer lige BiH kroz historiju." },
    ],
  }),
  errorComponent: LoadError,
  component: Klubovi,
});

type Tab = "klubovi" | "strijelci";

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

function TopScorers() {
  const crestFor = useClubCrest();
  const { data, isLoading } = useQuery({
    queryKey: ["brojke-v3"],
    queryFn: () => getBrojke(),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <TableSkeleton rows={10} cols={3} />
      </div>
    );
  }

  const first = data.seasons[0];
  const last = data.seasons[data.seasons.length - 1];
  const ranked = withRank(data.scorers.slice(0, 10));

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3">
        <h2 className="font-display text-lg font-bold uppercase">Top 10 strijelaca · Premijer liga</h2>
        <span className="text-xs text-muted-foreground">
          {first && last ? `${first} do ${last}` : ""}
        </span>
      </div>
      {ranked.length === 0 ? (
        <p className="px-4 py-8 text-center text-muted-foreground">Još nema podataka.</p>
      ) : (
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
              <th className="w-12 px-3 py-2 text-center">#</th>
              <th className="px-2 py-2 text-left">Igrač</th>
              <th className="w-24 px-3 py-2 text-right">Golova</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => (
              <tr key={`${r.name}-${i}`} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                <td className={`px-3 py-2.5 text-center font-semibold ${r.rank <= 3 ? "text-primary" : ""}`}>
                  {r.rank}
                </td>
                <td className="px-2 py-2.5">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`font-semibold ${r.rank <= 3 ? "text-primary" : ""}`}>{r.name}</span>
                    <ClubCrests clubs={r.clubs} crestFor={crestFor} />
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-base font-bold">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="border-t border-border px-4 py-3 text-right text-sm">
        <Link to="/brojke" className="font-semibold text-primary hover:underline">
          Cijela lista (Top 25, asistenti, Kup) →
        </Link>
      </div>
    </section>
  );
}

function Klubovi() {
  const [tab, setTab] = useState<Tab>("klubovi");
  const { data, isLoading } = useQuery({
    queryKey: ["all-time-teams"],
    queryFn: () => getAllTimeTeams(),
  });
  const crestFor = useClubCrest();
  const names = [...new Set((data ?? []).map((t) => t.team.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "bs"),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Fudbal / Bosna i Hercegovina</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Klubovi</h1>
        <div className="mt-4 flex gap-1">
          {(["klubovi", "strijelci"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              }`}
            >
              {t === "klubovi" ? "Klubovi" : "Top 10 strijelaca"}
            </button>
          ))}
        </div>
      </div>

      {tab === "strijelci" ? (
        <TopScorers />
      ) : isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={8} cols={3} />
        </div>
      ) : names.length === 0 ? (
        <p className="border-y border-border py-8 text-muted-foreground">Nema klubova.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {names.map((n) => {
            const c = crestFor(n);
            return (
              <Link
                key={n}
                to="/klub/$name"
                params={{ name: n }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 font-semibold hover:bg-muted"
              >
                {c ? (
                  <img src={c} alt="" className="size-8 shrink-0 object-contain" />
                ) : (
                  <span className="size-8 shrink-0" />
                )}
                {n}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
