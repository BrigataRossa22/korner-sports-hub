import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/reprezentacija")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "Reprezentacija — Korner BiH" },
      { name: "description", content: "Vijesti o reprezentaciji Bosne i Hercegovine." },
      { property: "og:title", content: "Reprezentacija — Korner BiH" },
      { property: "og:description", content: "Vijesti o reprezentaciji BiH." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: () => (
    <CategoryPage
      category="reprezentacija"
      intro="Reprezentacija Bosne i Hercegovine: utakmice, sastavi i najave."
      content={Route.useLoaderData()}
    />
  ),
});
