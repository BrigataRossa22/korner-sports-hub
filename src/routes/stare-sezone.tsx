import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArchiveTable, useSeasons } from "@/components/ArchiveTable";
import { LoadError } from "@/components/RouteFallbacks";

export const Route = createFileRoute("/stare-sezone")({
  head: () => ({
    meta: [
      { title: "Arhiva sezona — Korner BiH" },
      { name: "description", content: "Tabele Premijer lige BiH iz prošlih sezona." },
    ],
  }),
  errorComponent: LoadError,
  component: ArhivaSezona,
});

const KEY = "arhiva-sezona";

function ArhivaSezona() {
  const { seasons } = useSeasons();
  const [picked, setPicked] = useState("");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setPicked(saved);
    } catch {
      /* ignoriši */
    }
  }, []);

  const choose = (s: string) => {
    setPicked(s);
    try {
      sessionStorage.setItem(KEY, s);
    } catch {
      /* ignoriši */
    }
  };

  const season = seasons.includes(picked) ? picked : seasons[0] || "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Statistika</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Arhiva sezona</h1>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="season" className="text-sm font-semibold uppercase text-muted-foreground">
          Sezona
        </label>
        <select
          id="season"
          value={season}
          onChange={(e) => choose(e.target.value)}
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
