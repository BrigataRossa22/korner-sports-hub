import { ArticleRow } from "@/components/ArticleCard";
import { mostRead } from "@/lib/content";
import type { PublicContent } from "@/lib/content.functions";
import { useClubCrest } from "@/lib/use-club-crest";
import { Link } from "@tanstack/react-router";

export function Sidebar({ content }: { content: PublicContent }) {
  const read = mostRead(content.articles);
  const crestFor = useClubCrest();

  return (
    <aside className="space-y-8">
      <section>
        <h3 className="rule-top pt-2 font-display text-lg uppercase">Najčitanije</h3>
        <div className="mt-2">
          {read.map((article) => (
            <ArticleRow key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between bg-ink px-4 py-3 text-ink-foreground">
          <h3 className="font-display text-xl font-bold uppercase tracking-wide">Tabela</h3>
          <Link
            to="/tabela"
            aria-label="Cijela tabela"
            title="Cijela tabela"
            className="flex size-9 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground transition hover:opacity-90"
          >
            →
          </Link>
        </div>

        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="w-9 py-2.5 pl-4 text-left font-semibold">Poz</th>
              <th className="py-2.5 pl-2 text-left font-semibold">Klub</th>
              <th className="px-1.5 py-2.5 text-right font-semibold text-primary">Bod ↑</th>
              <th className="px-1.5 py-2.5 text-right font-semibold">Ut</th>
              <th className="py-2.5 pl-1.5 pr-4 text-right font-semibold">GR</th>
            </tr>
          </thead>
          <tbody>
            {content.standings.map((standing, index) => {
              const crest = crestFor(standing.team);
              const gd = standing.goalsFor - standing.goalsAgainst;
              return (
                <tr key={standing.id} className="border-b border-border last:border-0">
                  <td className="py-3 pl-4 font-semibold">{index + 1}</td>
                  <td className="py-3 pl-2">
                    <span className="flex items-center gap-2">
                      {crest ? (
                        <img src={crest} alt="" className="size-5 shrink-0 object-contain" />
                      ) : (
                        <span className="size-5 shrink-0" />
                      )}
                      <span className="truncate font-semibold">{standing.team}</span>
                    </span>
                  </td>
                  <td className="px-1.5 py-3 text-right text-base font-bold text-primary">
                    {standing.points}
                  </td>
                  <td className="px-1.5 py-3 text-right text-muted-foreground">
                    {standing.played}
                  </td>
                  <td className="py-3 pl-1.5 pr-4 text-right text-muted-foreground">
                    {gd > 0 ? "+" : ""}
                    {gd}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </aside>
  );
}
