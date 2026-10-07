import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StandingsTable } from "@/components/StandingsTable";
import { ArchiveTable, useSeasons } from "@/components/ArchiveTable";
import { TopPlayers } from "@/components/TopPlayers";
import { Attendance } from "@/components/Attendance";
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
  const { seasons } = useSeasons();
  const [season, setSeason] = useState("current");
  const isCurrent = season === "current";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Fudbal / Bosna i Hercegovina</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Tabela Premijer lige BiH</h1>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="season" className="text-sm font-semibold uppercase text-muted-foreground">
          Sezona
        </label>
        <select
          id="season"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold"
        >
          <option value="current">Aktuelna sezona</option>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isCurrent ? (
        standings.length ? (
          <StandingsTable standings={standings} />
        ) : (
          <p className="border-y border-border py-8 text-muted-foreground">Tabela još nije unesena.</p>
        )
      ) : (
        <ArchiveTable season={season} />
      )}

      {isCurrent && (
        <>
          <p className="mt-4 text-xs text-muted-foreground">Ut: utakmice · P: pobjede · N: neriješeno · I: porazi · GR: gol-razlika · Bod: bodovi. W: pobjeda · D: remi · L: poraz.</p>
          <TopPlayers />
          <Attendance />
        </>
      )}
    </div>
  );
}
