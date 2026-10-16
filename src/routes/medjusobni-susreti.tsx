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

function HeadToHeadPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["h2h-data"],
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

  const Select = ({
    value,
    onChange,
    label,
    crest,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
    crest: string | null;
  }) => (
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
            <Select value={a} onChange={setA} label="Klub 1" crest={crestA} />
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
            <Select value={b} onChange={setB} label="Klub 2" crest={crestB} />
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

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-4 text-center">
                <div>
                  <p className="text-3xl font-bold tabular-nums text-primary">{stats.winsA}</p>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Pobjeda · {a}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.draws}</p>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Neriješeno</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums text-primary">{stats.winsB}</p>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Pobjeda · {b}</p>
                </div>
                <p className="col-span-3 text-sm text-muted-foreground">
                  {shown.length} utakmica · golovi {stats.goalsA}:{stats.goalsB}
                </p>
              </div>

              {shown.length === 0 ? (
                <p className="mt-6 border-y border-border py-8 text-center text-muted-foreground">
                  Nema utakmica između ova dva kluba u bazi.
                </p>
              ) : (
                <div className="mt-6 overflow-x-auto border-y border-border">
                  <table className="w-full min-w-[640px] border-collapse text-sm tabular-nums">
                    <thead>
                      <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
                        <th className="px-2 py-3 text-left">Datum</th>
                        <th className="px-2 py-3 text-left">Takmičenje</th>
                        <th className="px-2 py-3 text-right">Domaćin</th>
                        <th className="w-16 px-2 py-3 text-center">Rez.</th>
                        <th className="px-2 py-3 text-left">Gost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((m, i) => {
                        const ch = crestFor(m.home);
                        const ca = crestFor(m.away);
                        return (
                          <tr key={i} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                            <td className="whitespace-nowrap px-2 py-3">{fmtDate(m.date)}</td>
                            <td className="px-2 py-3 text-muted-foreground">
                              {m.comp === "kup" ? "Kup BiH" : "Liga"} {m.season}
                              {m.round ? ` · ${m.comp === "liga" && /^\d+$/.test(m.round) ? `${m.round}. kolo` : m.round}` : ""}
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
