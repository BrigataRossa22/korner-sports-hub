import { useQuery } from "@tanstack/react-query";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getSeasonStandings } from "@/lib/seasons.functions";
import { getAllTimeTeams } from "@/lib/alltimeteams.functions";
import { useCrest } from "@/lib/use-crest";

const SUPA = "https://wxyxcfalnqttwchxebpn.supabase.co/storage/v1/object/public/slike/";

export function useSeasons() {
  const { data, isLoading } = useQuery({
    queryKey: ["season-standings"],
    queryFn: () => getSeasonStandings(),
  });
  const rows = data ?? [];
  const seasons = [...new Set(rows.map((r) => r.season))];
  return { rows, seasons, isLoading };
}

const PREFIXES = new Set(["fk", "nk", "hsk", "hnk", "sk", "gnk", "fc", "nogometni", "klub"]);

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !PREFIXES.has(w))
    .join(" ");
}

function useAllTimeCrest(): (team: string) => string {
  const { data } = useQuery({
    queryKey: ["all-time-teams"],
    queryFn: () => getAllTimeTeams(),
  });
  const list = (data ?? [])
    .filter((t) => t.crest)
    .map((t) => ({ key: norm(t.team), crest: t.crest }));

  return (team: string) => {
    const n = norm(team);
    if (!n) return "";
    let hit = list.find((t) => t.key === n);
    if (!hit) {
      hit = list
        .filter((t) => t.key.length >= 4 && (n.includes(t.key) || t.key.includes(n)))
        .sort((a, b) => b.key.length - a.key.length)[0];
    }
    if (!hit) return "";
    return hit.crest.startsWith("http") ? hit.crest : `${SUPA}${hit.crest}`;
  };
}

export function ArchiveTable({ season }: { season: string }) {
  const { rows, isLoading } = useSeasons();
  const allTimeCrest = useAllTimeCrest();
  const crestFor = useCrest();
  const list = rows.filter((r) => r.season === season).sort((a, b) => a.position - b.position);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <TableSkeleton rows={10} cols={8} />
      </div>
    );
  }
  if (list.length === 0) {
    return <p className="border-y border-border py-8 text-muted-foreground">Nema podataka za ovu sezonu.</p>;
  }

  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[600px] border-collapse text-sm tabular-nums">
        <thead>
          <tr className="border-b border-border bg-surface text-xs uppercase text-muted-foreground">
            <th className="w-10 px-2 py-3 text-center">#</th>
            <th className="px-2 py-3 text-left">Klub</th>
            <th className="w-10 px-1 py-3 text-center">Ut</th>
            <th className="w-10 px-1 py-3 text-center">P</th>
            <th className="w-10 px-1 py-3 text-center">N</th>
            <th className="w-10 px-1 py-3 text-center">I</th>
            <th className="w-16 px-1 py-3 text-center">Golovi</th>
            <th className="w-12 px-1 py-3 text-center">GR</th>
            <th className="w-12 px-2 py-3 text-center">Bod</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => {
            const crest = allTimeCrest(r.team) || crestFor(r.team);
            const gd = r.goals_for - r.goals_against;
            return (
              <tr key={r.id} className="border-b border-border/70 last:border-0 even:bg-surface/50">
                <td className="px-2 py-3 text-center font-semibold text-primary">{r.position}</td>
                <td className="px-2 py-3 text-left font-semibold">
                  <span className="flex items-center gap-2">
                    {crest ? (
                      <img src={crest} alt="" className="size-6 shrink-0 object-contain" />
                    ) : (
                      <span className="size-6 shrink-0" />
                    )}
                    {r.team}
                  </span>
                </td>
                <td className="px-1 py-3 text-center">{r.played}</td>
                <td className="px-1 py-3 text-center">{r.wins}</td>
                <td className="px-1 py-3 text-center">{r.draws}</td>
                <td className="px-1 py-3 text-center">{r.losses}</td>
                <td className="px-1 py-3 text-center">{r.goals_for}:{r.goals_against}</td>
                <td className="px-1 py-3 text-center">{gd > 0 ? "+" : ""}{gd}</td>
                <td className="px-2 py-3 text-center font-bold text-primary">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
