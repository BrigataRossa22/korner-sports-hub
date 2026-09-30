import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { LoadError } from "@/components/RouteFallbacks";
import { contentOptions } from "@/lib/content";

export const Route = createFileRoute("/o-nama")({
  loader: ({ context }) => context.queryClient.ensureQueryData(contentOptions),
  head: () => ({
    meta: [
      { title: "O nama — Korner BiH" },
      {
        name: "description",
        content: "Korner je bh. sportski portal nastao iz Instagram zajednice @korner_bih.",
      },
      { property: "og:title", content: "O nama — Korner BiH" },
      { property: "og:description", content: "Priča iza bh. sportskog portala Korner." },
    ],
  }),
  errorComponent: LoadError,
  component: About,
});

function About() {
  const { data } = useSuspenseQuery(contentOptions);
  const settings = data.settings;
  const paragraphs = settings.about
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="rule-top pt-3">
            <h1 className="text-4xl uppercase">O nama</h1>
          </div>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground/90">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {paragraphs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Tekst o nama još nije napisan. Urednici ga dodaju u panelu, u sekciji Postavke.
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-primary px-5 py-2.5 font-display text-sm uppercase tracking-wide text-primary-foreground"
              >
                Instagram
              </a>
            )}
            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-block border border-primary px-5 py-2.5 font-display text-sm uppercase tracking-wide text-primary"
              >
                Facebook
              </a>
            )}
            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="inline-block border border-border px-5 py-2.5 font-display text-sm uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                {settings.contactEmail}
              </a>
            )}
          </div>
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
