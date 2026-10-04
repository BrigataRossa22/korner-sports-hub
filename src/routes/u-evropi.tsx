import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
import { EuroTables } from "@/components/EuroTables";
import { EuroTotals } from "@/components/EuroTotals";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/u-evropi")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "U Evropi — Korner BiH" },
      { name: "description", content: "Bosanskohercegovački klubovi u evropskim takmičenjima." },
      { property: "og:title", content: "U Evropi — Korner BiH" },
      { property: "og:description", content: "Naši klubovi u evropskim takmičenjima." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: UEvropi,
});

function UEvropi() {
  return (
    <>
      <CategoryPage
        category="u-evropi"
        intro="Naši klubovi u Ligi prvaka, Evropskoj i Konferencijskoj ligi: rezultati, najave i analize."
        content={Route.useLoaderData()}
      />
      <div className="mx-auto max-w-6xl px-4 pb-12">
        <EuroTables />
        <EuroTotals />
      </div>
    </>
  );
}
