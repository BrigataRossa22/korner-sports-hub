import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/RouteFallbacks";
import { TableSkeleton } from "@/components/TableSkeleton";
import { getAllTimeTeams } from "@/lib/alltimeteams.functions";
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

function Klubovi() {
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
      </div>

      {isLoading ? (
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
