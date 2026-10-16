import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/kup-bih")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "Kup BiH — Korner BiH" },
      { name: "description", content: "Vijesti, rezultati i parovi iz Kupa BiH." },
      { property: "og:title", content: "Kup BiH — Korner BiH" },
      { property: "og:description", content: "Vijesti iz Kupa BiH." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: () => (
    <CategoryPage
      category="kup-bih"
      intro="Sve o Kupu BiH: parovi, rezultati i najave."
      content={Route.useLoaderData()}
    />
  ),
});
