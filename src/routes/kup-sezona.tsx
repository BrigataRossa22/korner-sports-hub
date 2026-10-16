import { createFileRoute } from "@tanstack/react-router";
import { CupMatches } from "@/components/CupMatches";

export const Route = createFileRoute("/kup-sezona")({
  head: () => ({
    meta: [{ title: "Kup BiH 2026-27 — Korner BiH" }],
  }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-2 pt-3">
        <p className="kicker">Kup BiH</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Sezona 26/27</h1>
      </div>
      <CupMatches scope="current" />
    </div>
  ),
});
