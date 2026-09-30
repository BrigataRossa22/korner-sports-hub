import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/fudbal")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "Fudbal — Korner BiH" },
      {
        name: "description",
        content:
          "Premijer liga BiH, reprezentacija, evropska takmičenja i transferi — fudbalske vijesti svakog dana.",
      },
      { property: "og:title", content: "Fudbal — Korner BiH" },
      {
        property: "og:description",
        content: "Premijer liga BiH, reprezentacija i evropska takmičenja.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: () => (
    <CategoryPage
      category="fudbal"
      intro="Premijer liga BiH, Kup, reprezentacija i evropska takmičenja — sve fudbalske vijesti na jednom mjestu."
      content={Route.useLoaderData()}
    />
  ),
});
