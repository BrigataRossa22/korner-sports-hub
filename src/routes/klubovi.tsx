import { useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getAllTimeTeams } from "@/lib/alltimeteams.functions";
import { getCurrentClubs } from "@/lib/currentclubs.functions";
import { displayClub, normClub } from "@/lib/club-match";
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

type Group = { label: string; fixed: boolean; raws: string[] };

function Klubovi() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-time-teams"],
    queryFn: () => getAllTimeTeams(),
  });
  const { data: current } = useQuery({
    queryKey: ["current-clubs"],
    queryFn: () => getCurrentClubs(),
  });
  const crestFor = useClubCrest();
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };

  // Klubovi koji se trenutno takmiče u ligi (gore, u traci)
  const currentItems = (current ?? []).map((team) => ({
    key: normClub(team),
    label: displayClub(team),
    link: team,
    crest: crestFor(team),
  }));
  const currentKeys = new Set(currentItems.map((c) => c.key));

  // Isti klub pod više imena (npr. "Alfa Modriča" i "Modriča Maxima") = jedna kartica
  const groups = new Map<string, Group>();
  for (const t of data ?? []) {
    const raw = t.team.trim();
    if (!raw) continue;
    const key = normClub(raw);
    const shown = displayClub(raw);
    const fixed = shown !== raw; // zadato zajedničko ime (npr. "Modriča", "Žepče")
    const g = groups.get(key);
    if (!g) {
      groups.set(key, { label: shown, fixed, raws: [raw] });
      continue;
    }
    if (!g.raws.includes(raw)) g.raws.push(raw);
    if (fixed) {
      g.label = shown;
      g.fixed = true;
    } else if (!g.fixed && raw.length < g.label.length) {
      g.label = raw;
    }
  }

  const items = [...groups.entries()]
    .filter(([key]) => !currentKeys.has(key))
    .map(([, g]) => {
      // Veza vodi na ime koje stvarno postoji u bazi (stranica kluba spaja sva imena)
      const link = g.raws.includes(g.label) ? g.label : g.raws[0];
      let crest = "";
      for (const r of [link, ...g.raws]) {
        crest = crestFor(r);
        if (crest) break;
      }
      return { label: g.label, link, crest };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "bs"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Fudbal / Bosna i Hercegovina</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Klubovi</h1>
      </div>

      {currentItems.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold uppercase">Premijer liga BiH</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                aria-label="Nazad"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-lg hover:bg-muted"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Naprijed"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-lg hover:bg-muted"
              >
                ›
              </button>
            </div>
          </div>
          <div
            ref={scroller}
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "thin" }}
          >
            {currentItems.map((c) => (
              <Link
                key={c.link}
                to="/klub/$name"
                params={{ name: c.link }}
                className="flex h-56 w-44 shrink-0 snap-start flex-col items-center justify-between rounded-xl border border-border bg-card px-3 py-6 text-center transition hover:-translate-y-0.5 hover:bg-muted sm:w-52"
              >
                <span className="flex flex-1 items-center justify-center">
                  {c.crest ? (
                    <img src={c.crest} alt="" className="size-24 object-contain sm:size-28" />
                  ) : (
                    <span className="flex size-24 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground sm:size-28">
                      {c.label.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="mt-3 font-display text-base font-bold uppercase leading-tight">
                  {c.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {currentItems.length > 0 && items.length > 0 && (
        <h2 className="mb-3 font-display text-xl font-bold uppercase">Ostali klubovi</h2>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={8} cols={3} />
        </div>
      ) : items.length === 0 && currentItems.length === 0 ? (
        <p className="border-y border-border py-8 text-muted-foreground">Nema klubova.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link
              key={it.link}
              to="/klub/$name"
              params={{ name: it.link }}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 font-semibold hover:bg-muted"
            >
              {it.crest ? (
                <img src={it.crest} alt="" className="size-8 shrink-0 object-contain" />
              ) : (
                <span className="size-8 shrink-0" />
              )}
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
