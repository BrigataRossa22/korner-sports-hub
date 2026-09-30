import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { articles, categoryLabels, getArticle } from "@/data/articles";

export const Route = createFileRoute("/clanak/$slug")({
  loader: ({ params }) => {
    const article = getArticle(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Nedostupno — Korner BiH" }, { name: "robots", content: "noindex" }] };
    }
    const { article } = loaderData;
    return {
      meta: [
        { title: `${article.title} — Korner BiH` },
        { name: "description", content: article.lead },
        { property: "og:title", content: article.title },
        { property: "og:description", content: article.lead },
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const related = articles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <article>
          <Link
            to={`/${article.category}` as "/fudbal"}
            className="kicker hover:underline"
          >
            {categoryLabels[article.category]}
          </Link>
          <h1 className="mt-2 text-3xl leading-tight sm:text-4xl">{article.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{article.lead}</p>
          <p className="mt-4 border-y border-border py-2 text-xs uppercase tracking-wide text-muted-foreground">
            {article.author} · {article.published} · {article.comments} komentara
          </p>
          <img
            src={article.image}
            alt={article.title}
            width={1600}
            height={912}
            className="mt-5 aspect-[16/9] w-full object-cover"
          />
          <div className="mt-6 space-y-4 text-base leading-relaxed">
            {article.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <section className="mt-12">
            <h2 className="rule-top pt-2 text-xl uppercase">Povezane vijesti</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-3">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} size="sm" />
              ))}
            </div>
          </section>
        </article>

        <Sidebar />
      </div>
    </div>
  );
}
