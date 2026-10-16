import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getH2HData, type H2HMatch } from "@/lib/h2h.functions";
import { sameClub } from "@/lib/club-match";
import { useClubCrest } from "@/lib/use-club-crest";

export const Route = createFileRoute("/medjusobni-susreti")({
  head: () => ({ meta: [{ title: "Međusobni susreti — Korner BiH" }] }),
  component: HeadToHeadPage,
});

type Filter = "sve" | "liga" | "kup";

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}.`;
}

// -1 = bez gledalaca (x), 0 ili nepoznato = —
function fmtAtt(n: number | null) {
  if (n == null || n === 0) return "—";
  if (n === -1) return "x";
  return n.toLocaleString("de-DE");
}

function ClubSelect({
  value,
  onChange,
  label,
  crest,
  clubs,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  crest: string | null;
  clubs: string[];
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div className="flex size-20 items-center justify-center">
        {crest ? <img src={crest} alt="" className="size-20 object-contain" /> : <span className="size-20" />}
      </div>
      <label className="w-full text-xs font-semibold uppercase text-muted-foreground">
        {label}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm font-semibold normal-case text-foreground"
        >
          <option value="">Izaberi klub</option>
          {clubs.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function HeadToHeadPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["h2h-data-v2"],
    queryFn: () => getH2HData(),
    staleTime: 60 * 60 * 1000,
  });
  const crestFor = useClubCrest();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [filter, setFilter] = useState<Filter>("sve");

  const clubs = data?.clubs ?? [];

  const all = useMemo(() => {
    if (!data || !a || !b || a === b || sameClub(a, b)) return [] as H2HMatch[];
    return data.matches
      .filter(
        (m) =>
          (sameClub(m.home, a) && sameClub(m.away, b)) ||
          (sameClub(m.home, b) && sameClub(m.away, a)),
      )
      .sort((x, y) => (y.date ?? "").localeCompare(x.date ?? ""));
  }, [data, a, b]);

  const shown = useMemo(() => (filter === "sve" ? all : all.filter((m) => m.comp === filter)), [all, filter]);

  const stats = useMemo(() => {
    let winsA = 0;
    let winsB = 0;
    let draws = 0;
    let goalsA = 0;
    let goalsB = 0;
    for (const m of shown) {
      const aHome = sameClub(m.home, a);
      const ga = aHome ? m.sh : m.sa;
      const gb = aHome ? m.sa : m.sh;
      goalsA += ga;
      goalsB += gb;
      if (ga > gb) winsA++;
      else if (gb > ga) winsB++;
      else draws++;
    }
    return { winsA, winsB, draws, goalsA, goalsB };
  }, [shown, a]);

  const ready = a && b && a !== b;
  const crestA = a ? crestFor(a) : null;
  const crestB = b ? crestFor(b) : null;
  const total = shown.length;
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  const totalGoals = stats.goalsA + stats.goalsB;
  const avg = total ? (totalGoals / total).toFixed(2).replace(".", ",") : "0";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Statistika</p>
      <h1 className="mb-6 font-display text-3xl font-bold uppercase">Međusobni susreti</h1>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={6} cols={4} />
        </div>
      ) : (
        <>
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
            <ClubSelect value={a} onChange={setA} label="Klub 1" crest={crestA} clubs={clubs} />
            <div className="flex items-center justify-center sm:pt-24">
              <button
                type="button"
                onClick={() => {
                  setA(b);
                  setB(a);
                }}
                className="rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-surface"
                title="Zamijeni klubove"
              >
                ⇄
              </button>
            </div>
            <ClubSelect value={b} onChange={setB} label="Klub 2" crest={crestB} clubs={clubs} />
          </div>

          {!ready && (
            <p className="mt-8 border-y border-border py-8 text-center text-muted-foreground">
              {a && a === b ? "Izaberi dva različita kluba." : "Izaberi dva kluba da vidiš njihov međusobni omjer."}
            </p>
          )}

          {ready && (
            <>
              <div className="mt-8 flex gap-2">
                {(["sve", "liga", "kup"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                      filter === f ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
                    }`}
                  >
                    {f === "sve" ? "Sve" : f === "liga" ? "Liga" : "Kup BiH"}
                  </button>
                ))}
              </div>

              <section className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {crestA ? <img src={crestA} alt="" className="size-8 shrink-0 object-contain" /> : null}
                    <span className="truncate text-sm font-bold uppercase">{a}</span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold uppercase text-muted-foreground">
                    {total} {total === 1 ? "utakmica" : "utakmica"}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    <span className="truncate text-right text-sm font-bold uppercase">{b}</span>
                    {crestB ? <img src={crestB} alt="" className="size-8 shrink-0 object-contain" /> : null}
                  </div>
                </div>

                <div className="px-4 py-5">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pobjede i neriješeno
                  </p>
                  <div className="grid grid-cols-3 items-end text-center">
                    <div>
                      <p className="text-5xl font-bold tabular-nums text-primary">{stats.winsA}</p>
                      <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">Pobjeda</p>
                    </div>
                    <div>
                      <p className="text-5xl font-bold tabular-nums">{stats.draws}</p>
                      <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">Neriješeno</p>
                    </div>
                    <div>
                      <p className="text-5xl font-bold tabular-nums text-primary">{stats.winsB}</p>
                      <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">Pobjeda</p>
                    </div>
                  </div>

                  <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-border">
                    <div className="bg-primary" style={{ width: `${pct(stats.winsA)}%` }} />
                    <div className="bg-muted-foreground/40" style={{ width: `${pct(stats.draws)}%` }} />
                    <div className="bg-foreground" style={{ width: `${pct(stats.winsB)}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
                    <span>{Math.round(pct(stats.winsA))}%</span>
                    <span>{Math.round(pct(stats.draws))}%</span>
                    <span>{Math.round(pct(stats.winsB))}%</span>
                  </div>
                </div>

                <div className="border-t border-border px-4 py-5">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Golovi
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <p className="text-5xl font-bold tabular-nums text-primary">{stats.goalsA}</p>
                    <span className="text-3xl font-bold text-muted-foreground">:</span>
                    <p className="text-5xl font-bold tabular-nums text-primary">{stats.goalsB}</p>
                  </div>
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    Ukupno {totalGoals} golova · prosjek {avg} po utakmici
                  </p>
                </div>
              </section>

              {shown.length === 0 ? (
                <p className="mt-6 border-y border-border py-8 text-center text-muted-foreground">
                  Nema utakmica između ova dva kluba u bazi.
                </p>
              ) : (
                <div className="mt-6 overflow-x-auto border-y border-border">
                  <table className="w-full min-w-[700px] border-collapse text-sm tabular-nums">
                    <thead>
                      <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                        <th className="px-2 py-3 text-left">Datum</th>
                        <th className="px-2 py-3 text-left">Takmičenje</th>
                        <th className="px-2 py-3 text-right">Domaćin</th>
                        <th className="w-16 px-2 py-3 text-center">Rez.</th>
                        <th className="px-2 py-3 text-left">Gost</th>
                        <th className="w-20 px-2 py-3 text-right">Posjeta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((m, i) => {
                        const ch = crestFor(m.home);
                        const ca = crestFor(m.away);
                        return (
                          <tr key={i} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                            <td className="whitespace-nowrap px-2 py-3">{fmtDate(m.date)}</td>
                            <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">
                              {m.comp === "kup" ? "Kup BiH" : "Liga"} {m.season}
                            </td>
                            <td className="px-2 py-3 text-right font-semibold">
                              <span className="inline-flex items-center justify-end gap-2">
                                {m.home}
                                {ch ? <img src={ch} alt="" className="size-5 object-contain" /> : null}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center font-bold text-primary">
                              {m.sh}:{m.sa}
                            </td>
                            <td className="px-2 py-3 text-left font-semibold">
                              <span className="inline-flex items-center gap-2">
                                {ca ? <img src={ca} alt="" className="size-5 object-contain" /> : null}
                                {m.away}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-right text-muted-foreground">{fmtAtt(m.att)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
