import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/ostali-sportovi")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "Ostali sportovi — Korner BiH" },
      {
        name: "description",
        content:
          "Odbojka, rukomet, tenis, atletika i ostali sportovi — rezultati, najave i priče iz Bosne i Hercegovine.",
      },
      { property: "og:title", content: "Ostali sportovi — Korner BiH" },
      {
        property: "og:description",
        content: "Odbojka, rukomet, tenis i atletika — vijesti iz BiH.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: () => (
    <CategoryPage
      category="ostali-sportovi"
      intro="Odbojka, rukomet, tenis, atletika i svi drugi sportovi — rezultati, najave i priče naših sportista."
      content={Route.useLoaderData()}
    />
  ),
});
