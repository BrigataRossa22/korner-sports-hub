import { createFileRoute } from "@tanstack/react-router";
import { StandingsTable } from "@/components/StandingsTable";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/tabela")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "Tabela Premijer lige BiH — Korner BiH" },
      { name: "description", content: "Poredak klubova Premijer lige BiH: bodovi, gol-razlika i forma na jednom mjestu." },
      { property: "og:title", content: "Tabela Premijer lige BiH — Korner BiH" },
      { property: "og:description", content: "Poredak klubova Premijer lige BiH: bodovi, gol-razlika i forma na jednom mjestu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: Tabela,
});

function Tabela() {
  const { standings } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Fudbal / Bosna i Hercegovina</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Tabela Premijer lige BiH</h1>
      </div>
      {standings.length ? (
        <StandingsTable standings={standings} />
      ) : (
        <p className="border-y border-border py-8 text-muted-foreground">Tabela još nije unesena.</p>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Ut: utakmice · P: pobjede · N: neriješeno · I: porazi · GR: gol-razlika · Bod: bodovi. W: pobjeda · D: remi · L: poraz.</p>
    </div>
  );
}