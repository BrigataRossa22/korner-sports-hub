import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/medjusobni-susreti")({
  head: () => ({
    meta: [{ title: "Međusobni susreti — Korner BiH" }],
  }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="rule-top mb-5 pt-3">
        <p className="kicker">Statistika</p>
        <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">Međusobni susreti</h1>
      </div>
      <p className="border-y border-border py-8 text-muted-foreground">Uskoro.</p>
    </div>
  ),
});
