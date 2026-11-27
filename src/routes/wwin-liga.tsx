import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/wwin-liga")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "WWiN liga — Korner BiH" },
      { name: "description", content: "Vijesti, rezultati i analize iz WWiN lige BiH." },
      { property: "og:title", content: "WWiN liga — Korner BiH" },
      { property: "og:description", content: "Vijesti iz WWiN lige BiH." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: Page,
});

function Page() {
  const content = Route.useLoaderData();
  // Sve vijesti o ovome: iz rubrike, ali i one čija oznaka iznad naslova to spominje
  const articles = content.articles.filter(
    (a) => a.category === "wwin-liga" || /plbih|wwin|premijer/i.test(a.kicker),
  );
  return (
    <CategoryPage
      category="wwin-liga"
      intro="Sve o WWiN ligi BiH: kola, rezultati, transferi i analize."
      content={content}
      articles={articles}
    />
  );
}
