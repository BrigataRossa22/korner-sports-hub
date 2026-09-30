import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/o-nama")({
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
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rule-top pt-3">
        <h1 className="text-4xl uppercase">O nama</h1>
      </div>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground/90">
        <p>
          Korner je sportski portal iz Bosne i Hercegovine. Krenuli smo kao Instagram zajednica
          @korner_bih, a danas pratimo fudbal, košarku i sve ostale sportove u kojima naši
          sportisti ostavljaju trag.
        </p>
        <p>
          Pišemo brzo, kratko i bez fraza — vijesti sa terena, transferi, analize kola i priče o
          ljudima koji stoje iza rezultata.
        </p>
        <p className="text-sm text-muted-foreground">
          Napomena: tekstovi na ovom sajtu su primjeri sadržaja. Pošaljite nam prave vijesti,
          kontakt podatke i logo pa ćemo ih ubaciti.
        </p>
      </div>
      <a
        href="https://www.instagram.com/korner_bih/"
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-block bg-primary px-5 py-2.5 font-display text-sm uppercase tracking-wide text-primary-foreground"
      >
        Instagram @korner_bih
      </a>
    </div>
  );
}
