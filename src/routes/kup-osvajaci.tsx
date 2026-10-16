import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/kup-osvajaci")({
  head: () => ({
    meta: [{ title: "Osvajači Kupa BiH — Korner BiH" }],
  }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Kup BiH</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Osvajači</h1>
      </div>
      <p className="border-y border-border py-8 text-muted-foreground">Uskoro.</p>
    </div>
  ),
});
