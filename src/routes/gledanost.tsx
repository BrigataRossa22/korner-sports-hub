import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { normClub } from "@/lib/club-match";
import { getGledanost } from "@/lib/gledanost.functions";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/gledanost")({
  head: () => ({ meta: [{ title: "Gledanost — Korner BiH" }] }),
  component: GledanostPage,
});

const ALL = "sve";

type Sort = "prosjek" | "ukupno";

type ClubRow = {
  key: string;
  name: string;
  games: number;
  total: number;
  seasons: Set<string>;
};

const fmt = (n: number) => Math.round(n).toLocaleString("de-DE");

function GledanostPage() {
  const crestFor = useClubCrest();
  const { data, isLoading } = useQuery({
    queryKey: ["gledanost-v1"],
    queryFn: () => getGledanost(),
    staleTime: 60 * 60 * 1000,
  });

  const [pick, setPick] = useState("");
  const [sort, setSort] = useState<Sort>("prosjek");

  const seasons = data?.seasons ?? [];
  const season = pick || seasons[0] || "";
  const isAll = season === ALL;

  const clubs: ClubRow[] = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, ClubRow & { lastSeason: string }>();
    for (const r of data.rows) {
      if (!isAll && r.season !== season) continue;
      const key = normClub(r.club);
      if (!key) continue;
      const e =
        map.get(key) ??
        { key, name: r.club, games: 0, total: 0, seasons: new Set<string>(), lastSeason: r.season };
      e.games += 1;
      e.total += r.att;
      e.seasons.add(r.season);
      // za prikaz uzimamo ime iz najnovije sezone
      if (r.season >= e.lastSeason) {
        e.lastSeason = r.season;
        e.name = r.club;
      }
      map.set(key, e);
    }
    const list = [...map.values()];
    const avg = (c: ClubRow) => c.total / c.games;
    list.sort((a, b) =>
      sort === "prosjek"
        ? avg(b) - avg(a) || b.total - a.total
        : b.total - a.total || avg(b) - avg(a),
    );
    return list;
  }, [data, season, isAll, sort]);

  const totalAtt = clubs.reduce((s, c) => s + c.total, 0);
  const totalGames = clubs.reduce((s, c) => s + c.games, 0);
  const leagueAvg = totalGames ? totalAtt / totalGames : 0;
  const maxAvg = clubs.reduce((m, c) => Math.max(m, c.total / c.games), 0);
  const best = [...clubs].sort((a, b) => b.total / b.games - a.total / a.games)[0];

  // Mjesto u tabeli: isti broj = isto mjesto
  const ranked = (() => {
    let rank = 0;
    let prev = -1;
    return clubs.map((c, i) => {
      const v = sort === "prosjek" ? Math.round(c.total / c.games) : c.total;
      if (v !== prev) {
        rank = i + 1;
        prev = v;
      }
      return { ...c, rank };
    });
  })();

  return (
    <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Statistika</p>
      <h1 className="font-display text-3xl font-bold uppercase">Gledanost</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Gledanost na ligaškim utakmicama kod kuće. Ne računaju se Kup, Evropa, utakmice bez publike ni
        utakmice čija posjeta nije poznata.
      </p>

      {isLoading || !data ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={10} cols={5} />
        </div>
      ) : seasons.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-muted-foreground">
          Još nema podataka o gledanosti.
        </p>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Sezona
              <select
                value={season}
                onChange={(e) => setPick(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold normal-case text-foreground sm:w-auto"
              >
                <option value={ALL}>Sve sezone (2002-03 do danas)</option>
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-1 sm:flex">
              {(["prosjek", "ukupno"] as Sort[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase sm:px-4 sm:py-1.5 sm:text-xs ${
                    sort === s ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
                  }`}
                >
                  Po {s === "prosjek" ? "prosjeku" : "ukupnom broju"}
                </button>
              ))}
            </div>
          </div>

          {clubs.length === 0 ? (
            <p className="border-y border-border py-8 text-center text-muted-foreground">
              Za sezonu {season} nema podataka o gledanosti (npr. igrana bez publike ili posjete nisu upisane).
            </p>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                  <p className="text-3xl font-bold tabular-nums text-primary">{fmt(leagueAvg)}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
                    Prosjek lige po utakmici
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                  <p className="text-3xl font-bold tabular-nums">{fmt(totalAtt)}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
                    Ukupno gledalaca ({totalGames} utakmica)
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                  <p className="truncate text-xl font-bold">{best?.name ?? "—"}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
                    Najgledaniji klub (prosjek {best ? fmt(best.total / best.games) : "—"})
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full table-fixed border-collapse text-[13px] tabular-nums sm:table-auto sm:text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                      <th className="w-8 px-1 py-3 text-center sm:w-12 sm:px-3">#</th>
                      <th className="px-1 py-3 text-left sm:px-2">Klub</th>
                      {isAll && (
                        <th className="w-9 px-1 py-3 text-right sm:w-auto sm:px-3">
                          <span className="sm:hidden">Sez.</span>
                          <span className="hidden sm:inline">Sezona</span>
                        </th>
                      )}
                      <th className="w-9 px-1 py-3 text-right sm:w-auto sm:px-3">
                        <span className="sm:hidden">Ut.</span>
                        <span className="hidden sm:inline">Utakmica</span>
                      </th>
                      <th className="w-[4.25rem] px-1 py-3 text-right sm:w-auto sm:px-3">Ukupno</th>
                      <th className="w-[3.75rem] px-1 py-3 text-right sm:w-auto sm:px-3">
                        <span className="sm:hidden">Pros.</span>
                        <span className="hidden sm:inline">Prosjek</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((c) => {
                      const avg = c.total / c.games;
                      const crest = crestFor(c.name);
                      return (
                        <tr key={c.key} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                          <td className={`px-1 py-3 text-center font-semibold sm:px-3 ${c.rank <= 3 ? "text-primary" : ""}`}>
                            {c.rank}
                          </td>
                          <td className="min-w-0 px-1 py-3 sm:px-2">
                            <span className="flex min-w-0 items-center gap-1.5 font-semibold sm:gap-2">
                              {crest ? (
                                <img src={crest} alt="" className="size-5 shrink-0 object-contain sm:size-6" />
                              ) : (
                                <span className="size-5 shrink-0 sm:size-6" />
                              )}
                              <span className="truncate">{c.name}</span>
                            </span>
                            <span className="mt-1 block h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-border">
                              <span
                                className="block h-full rounded-full bg-primary"
                                style={{ width: `${maxAvg ? (avg / maxAvg) * 100 : 0}%` }}
                              />
                            </span>
                          </td>
                          {isAll && <td className="px-1 py-3 text-right sm:px-3">{c.seasons.size}</td>}
                          <td className="px-1 py-3 text-right sm:px-3">{c.games}</td>
                          <td className={`px-1 py-3 text-right sm:px-3 ${sort === "ukupno" ? "font-bold" : ""}`}>
                            {fmt(c.total)}
                          </td>
                          <td className={`px-1 py-3 text-right sm:px-3 ${sort === "prosjek" ? "font-bold" : ""}`}>
                            {fmt(avg)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-4 border-foreground/30 bg-surface font-bold">
                      <td className="px-1 py-3 sm:px-3" />
                      <td className="px-1 py-3 uppercase sm:px-2">Cijela liga</td>
                      {isAll && <td className="px-1 py-3 text-right sm:px-3">{seasons.length}</td>}
                      <td className="px-1 py-3 text-right sm:px-3">{totalGames}</td>
                      <td className="px-1 py-3 text-right sm:px-3">{fmt(totalAtt)}</td>
                      <td className="px-1 py-3 text-right sm:px-3">{fmt(leagueAvg)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
