import { createFileRoute, Link } from "@tanstack/react-router";
import { ArticleCard, ArticleRow } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { articles } from "@/data/articles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Korner BiH — sportske vijesti iz BiH i svijeta" },
      {
        name: "description",
        content:
          "Najnovije sportske vijesti: fudbal, košarka, reprezentacija BiH, Premijer liga, transferi i analize.",
      },
      { property: "og:title", content: "Korner BiH — sportske vijesti" },
      {
        property: "og:description",
        content: "Fudbal, košarka i sve o sportu u Bosni i Hercegovini.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const lead = articles[0]!;
  const rest = articles.slice(1);
  const secondary = rest.slice(0, 2);
  const grid = rest.slice(2);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <section className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
            <article className="group">
              <Link to="/clanak/$slug" params={{ slug: lead.slug }}>
                <div className="overflow-hidden bg-muted">
                  <img
                    src={lead.image}
                    alt={lead.title}
                    width={1600}
                    height={912}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <p className="kicker mt-3">{lead.kicker}</p>
                <h1 className="mt-1 text-3xl leading-tight group-hover:text-primary sm:text-4xl">
                  {lead.title}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">{lead.lead}</p>
              </Link>
            </article>

            <div className="space-y-6">
              {secondary.map((a) => (
                <ArticleCard key={a.slug} article={a} size="sm" />
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="rule-top pt-2 text-xl uppercase">Aktuelno</h2>
            <div className="mt-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((a) => (
                <ArticleCard key={a.slug} article={a} size="sm" />
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="rule-top pt-2 text-xl uppercase">Posljednje vijesti</h2>
            <div className="mt-2">
              {articles.map((a) => (
                <ArticleRow key={`row-${a.slug}`} article={a} />
              ))}
            </div>
          </section>
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
