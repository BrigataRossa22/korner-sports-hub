import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/raspored-i-rezultati")({
  head: () => ({
    meta: [{ title: "Raspored i rezultati — Korner BiH" }],
  }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">WWiN liga</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Raspored i rezultati</h1>
      </div>
      <p className="border-y border-border py-8 text-muted-foreground">Uskoro.</p>
    </div>
  ),
});
