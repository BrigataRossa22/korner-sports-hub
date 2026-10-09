import { createFileRoute } from "@tanstack/react-router";
import { EuroTables } from "@/components/EuroTables";
import { EuroTotals } from "@/components/EuroTotals";
import { LoadError } from "@/components/RouteFallbacks";

export const Route = createFileRoute("/u-evropi")({
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-2 pt-3">
        <p className="kicker">Statistika</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">U Evropi</h1>
      </div>
      <EuroTables />
      <EuroTotals />
    </div>
  );
}
