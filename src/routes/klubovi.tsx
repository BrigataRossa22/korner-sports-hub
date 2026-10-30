import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getAllTimeTeams } from "@/lib/alltimeteams.functions";
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
  const crestFor = useClubCrest();

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

  const items = [...groups.values()]
    .map((g) => {
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

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card">
          <TableSkeleton rows={8} cols={3} />
        </div>
      ) : items.length === 0 ? (
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
