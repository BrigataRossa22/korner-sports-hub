import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/nize-lige")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "Niže lige — Korner BiH" },
      { name: "description", content: "Vijesti i rezultati iz nižih liga u BiH." },
      { property: "og:title", content: "Niže lige — Korner BiH" },
      { property: "og:description", content: "Vijesti iz nižih liga u BiH." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: () => (
    <CategoryPage
      category="nize-lige"
      intro="Prva i druga liga, regionalne lige i lokalni fudbal iz cijele BiH."
      content={Route.useLoaderData()}
    />
  ),
});
