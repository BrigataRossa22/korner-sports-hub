import { ArticleRow } from "@/components/ArticleCard";
import { FavCrest } from "@/components/FavCrest";
import type { PublicContent } from "@/lib/content.functions";
import { displayClub, normClub, sameClub } from "@/lib/club-match";
import { useMembership } from "@/lib/use-membership";

const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ");

/** Na početnoj: vijesti, mjesto u tabeli i utakmice omiljenog kluba prijavljenog člana. */
export function MojKlubBox({ content }: { content: PublicContent }) {
  const m = useMembership();
  const fav = m.favClub;
  if (!m.hasAccess || !fav) return null;

  const key = normClub(fav);
  const pos = content.standings.findIndex((s) => sameClub(s.team, fav));
  const st = pos >= 0 ? content.standings[pos] : null;

  const mine = content.fixtures.filter((f) => sameClub(f.home, fav) || sameClub(f.away, fav));
  const next = mine.find((f) => !f.finished);
  const last = [...mine].reverse().find((f) => f.finished);

  const news =
    key.length >= 4
      ? content.articles
          .filter((a) => plain(`${a.title} ${a.lead}`).includes(key))
          .slice(0, 3)
      : [];

  const fx = (f: (typeof mine)[number]) => (
    <>
      {f.home}{" "}
      {f.finished && f.scoreHome != null && f.scoreAway != null ? (
        <span className="tabular-nums text-primary">
          {f.scoreHome}:{f.scoreAway}
        </span>
      ) : (
        "–"
      )}{" "}
      {f.away}
    </>
  );

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 bg-ink px-4 py-3 text-ink-foreground">
        <FavCrest club={fav} className="size-10" />
        <div className="min-w-0">
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-primary">Moj klub</p>
          <h2 className="truncate font-display text-xl font-bold uppercase">{displayClub(fav)}</h2>
        </div>
      </div>
      <div className="grid gap-6 p-4 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4 text-sm">
          {st && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Tabela</p>
              <p className="mt-1">
                <span className="font-display text-2xl font-bold text-primary">{pos + 1}.</span>{" "}
                mjesto · <b>{st.points}</b> bod · {st.played} ut · {st.goalsFor}:{st.goalsAgainst}
              </p>
            </div>
          )}
          {next && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Sljedeća utakmica</p>
              <p className="mt-1 font-semibold leading-snug">{fx(next)}</p>
              <p className="text-xs text-muted-foreground">{next.when}</p>
            </div>
          )}
          {last && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Posljednja utakmica</p>
              <p className="mt-1 font-semibold leading-snug">{fx(last)}</p>
              <p className="text-xs text-muted-foreground">{last.when}</p>
            </div>
          )}
          {!st && !next && !last && (
            <p className="text-muted-foreground">Za ovaj klub trenutno nema podataka o ligi.</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Vijesti o klubu</p>
          {news.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Trenutno nema novih vijesti o ovom klubu.</p>
          ) : (
            <div className="mt-1">
              {news.map((a) => (
                <ArticleRow key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
