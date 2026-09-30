import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

export const Route = createFileRoute("/o-nama")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "O nama — Korner BiH" },
      {
        name: "description",
        content: "Ko stoji iza portala Korner BiH, čime se bavimo i kako nas kontaktirati.",
      },
      { property: "og:title", content: "O nama — Korner BiH" },
      { property: "og:description", content: "Ko stoji iza portala Korner BiH i kako nas kontaktirati." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: ONama,
});

function ONama() {
  const content = Route.useLoaderData();
  const { settings } = content;
  const paragraphs = settings.about
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="rule-top pt-3 text-4xl uppercase">O nama</h1>
          <div className="mt-6 space-y-4">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-[1.05rem] leading-relaxed text-foreground/90">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Instagram
              </a>
            )}
            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium"
              >
                Facebook
              </a>
            )}
            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium"
              >
                Pošalite nam email
              </a>
            )}
          </div>
        </div>
        <Sidebar content={Route.useLoaderData()} />
      </div>
    </div>
  );
}
