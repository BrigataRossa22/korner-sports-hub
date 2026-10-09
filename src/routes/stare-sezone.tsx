import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArchiveTable, useSeasons } from "@/components/ArchiveTable";
import { LoadError } from "@/components/RouteFallbacks";

export const Route = createFileRoute("/stare-sezone")({
  head: () => ({
    meta: [
      { title: "Stare sezone — Korner BiH" },
      { name: "description", content: "Tabele Premijer lige BiH iz prošlih sezona." },
    ],
  }),
  errorComponent: LoadError,
  component: StareSezone,
});

function StareSezone() {
  const { seasons } = useSeasons();
  const [picked, setPicked] = useState("");
  const season = picked || seasons[0] || "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Statistika</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Stare sezone</h1>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="season" className="text-sm font-semibold uppercase text-muted-foreground">
          Sezona
        </label>
        <select
          id="season"
          value={season}
          onChange={(e) => setPicked(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold"
        >
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {season ? (
        <ArchiveTable season={season} />
      ) : (
        <p className="border-y border-border py-8 text-muted-foreground">Nema podataka.</p>
      )}
    </div>
  );
}
