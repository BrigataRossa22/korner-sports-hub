import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { ArticleMissing, LoadError } from "@/components/RouteFallbacks";
import { categoryHrefs, categoryLabels, contentOptions, formatDate } from "@/lib/content";

export const Route = createFileRoute("/clanak/$slug")({
  loader: async ({ context, params }) => {
    const content = await context.queryClient.ensureQueryData(contentOptions);
    const article = content.articles.find((item) => item.slug === params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Vijest nije pronađena — Korner BiH" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { article } = loaderData;
    const meta = [
      { title: `${article.title} — Korner BiH` },
      { name: "description", content: article.lead },
      { property: "og:type", content: "article" },
      { property: "og:title", content: article.title },
      { property: "og:description", content: article.lead },
    ];
    if (article.imageAbs) {
      meta.push(
        { property: "og:image", content: article.imageAbs },
        { name: "twitter:image", content: article.imageAbs },
      );
    }
    return { meta };
  },
  notFoundComponent: ArticleMissing,
  errorComponent: LoadError,
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const { data } = useSuspenseQuery(contentOptions);
  const related = data.articles.filter((item) => item.id !== article.id).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <article>
          <Link to={categoryHrefs[article.category]} className="kicker hover:underline">
            {categoryLabels[article.category]}
          </Link>
          <h1 className="mt-2 text-3xl leading-tight sm:text-4xl">{article.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{article.lead}</p>
          <p className="mt-4 border-y border-border py-2 text-xs uppercase tracking-wide text-muted-foreground">
            {article.author} · {formatDate(article.publishedAt)} · {article.comments} komentara
          </p>
          {article.image && (
            <img
              src={article.image}
              alt={article.title}
              width={1600}
              height={912}
              className="mt-5 aspect-[16/9] w-full object-cover"
            />
          )}
          <div className="mt-6 space-y-4 text-base leading-relaxed">
            {article.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <section className="mt-12">
            <h2 className="rule-top pt-2 text-xl uppercase">Povezane vijesti</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} size="sm" />
              ))}
            </div>
          </section>
        </article>

        <Sidebar />
      </div>
    </div>
  );
}
