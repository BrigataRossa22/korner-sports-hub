import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/kosarka")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "Košarka — Korner BiH" },
      {
        name: "description",
        content:
          "Reprezentacija BiH, WABA liga, klubovi i evropska takmičenja — košarkaške vijesti iz Bosne i Hercegovine.",
      },
      { property: "og:title", content: "Košarka — Korner BiH" },
      {
        property: "og:description",
        content: "Reprezentacija BiH, WABA liga i klubovi — košarkaške vijesti.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: () => (
    <CategoryPage
      category="kosarka"
      intro="Reprezentacija, WABA liga, klubovi i evropska takmičenja — sve o košarci u Bosni i Hercegovini."
      content={Route.useLoaderData()}
    />
  ),
});
