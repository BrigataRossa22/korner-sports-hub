import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Mail, Megaphone, Newspaper, Send, Users } from "lucide-react";
import { LoadError } from "@/components/RouteFallbacks";
import { getPublicContent } from "@/lib/content.functions";

const EMAIL = "kornerbih@outlook.com";

export const Route = createFileRoute("/kontakt")({
  loader: () => getPublicContent(),
  head: () => ({
    meta: [
      { title: "Kontakt — Korner BiH" },
      {
        name: "description",
        content:
          "Javite nam se: saradnja, oglašavanje, vijesti i ispravke. Korner BiH — sportski portal iz Bosne i Hercegovine.",
      },
      { property: "og:title", content: "Kontakt — Korner BiH" },
      {
        property: "og:description",
        content: "Za saradnju, oglašavanje, vijesti i ispravke javite nam se na kornerbih@outlook.com.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: LoadError,
  component: Kontakt,
});

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

const WAYS = [
  {
    icon: Megaphone,
    title: "Oglašavanje i sponzorstva",
    text: "Želite da vaš brend bude vidljiv sportskoj publici u BiH? Banneri, sponzorirani sadržaj i partnerski paketi — javite nam se pa ćemo zajedno složiti ponudu.",
  },
  {
    icon: Users,
    title: "Partnerstva i saradnja",
    text: "Klubovi, saveze, akademije, turniri i medijski partneri: otvoreni smo za razmjenu sadržaja, zajedničke projekte i promociju utakmica i događaja.",
  },
  {
    icon: Newspaper,
    title: "Pišite za Korner",
    text: "Volite sport i pišete, fotografišete ili pratite lokalne utakmice? Pošaljite nam kratak opis i primjer rada, uvijek tražimo nove autore i dopisnike.",
  },
  {
    icon: Send,
    title: "Vijesti i ispravke",
    text: "Imate informaciju, rezultat ili fotografiju koju bi trebalo objaviti? Ili ste uočili grešku u podacima? Pošaljite nam, ispravit ćemo je što prije.",
  },
];

const FAQ = [
  {
    q: "Kako mogu javiti vijest ili rezultat?",
    a: `Pošaljite nam poruku na ${EMAIL} ili preko obrasca iznad. Navedite ko, šta, gdje i kada, a ako imate fotografiju, priložite je.`,
  },
  {
    q: "Primijetio sam grešku u statistici ili rezultatu.",
    a: "Napišite nam o kojoj se utakmici, sezoni ili igraču radi i šta je tačno ispravno. Podatke provjeravamo i ispravljamo.",
  },
  {
    q: "Možemo li zajedno objaviti vijest ili promociju?",
    a: "Naravno. Opišite nam šta imate na umu i javit ćemo vam se s prijedlogom.",
  },
  {
    q: "Gdje vas još mogu pratiti?",
    a: "Na Instagramu pratimo utakmice i novosti iz BiH, a sve vijesti i statistike su i ovdje na portalu.",
  },
];

function Kontakt() {
  const { settings } = Route.useLoaderData();
  const instagram = settings.instagram || "";
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("Saradnja");
  const [message, setMessage] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = `${message}\n\n— ${name}${from ? ` (${from})` : ""}`;
    const href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      `${subject} — Korner BiH`,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  const field =
    "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div>
      {/* Gornji dio */}
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Kontakt</p>
          <h1 className="mt-3 max-w-3xl text-4xl uppercase leading-tight sm:text-6xl">
            Javite nam se
          </h1>
          <p className="mt-5 max-w-2xl text-base text-ink-foreground/75 sm:text-lg">
            Imate vijest, ideju ili prijedlog? Tražite saradnju ili želite da se oglašavate na
            Korneru? Pišite nam, rado ćemo se čuti.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:opacity-90"
            >
              <Mail className="size-4" /> Pošaljite email
            </a>
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/25 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide hover:bg-white/10"
              >
                <InstagramIcon className="size-4" /> Instagram
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Kartice */}
        <section className="grid gap-4 sm:grid-cols-3">
          <a
            href={`mailto:${EMAIL}`}
            className="group rounded-xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          >
            <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <Mail className="size-5" />
            </span>
            <p className="mt-4 font-display text-lg font-bold uppercase">Email</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">{EMAIL}</p>
            <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Napišite nam <ArrowUpRight className="size-4" />
            </p>
          </a>

          {instagram ? (
            <a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <InstagramIcon className="size-5" />
              </span>
              <p className="mt-4 font-display text-lg font-bold uppercase">Instagram</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pratite nas za novosti, rezultate i zanimljivosti.
              </p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Otvorite profil <ArrowUpRight className="size-4" />
              </p>
            </a>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-6">
              <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <InstagramIcon className="size-5" />
              </span>
              <p className="mt-4 font-display text-lg font-bold uppercase">Instagram</p>
              <p className="mt-1 text-sm text-muted-foreground">Pratite nas na Instagramu.</p>
            </div>
          )}

          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent("Saradnja — Korner BiH")}`}
            className="group rounded-xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          >
            <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <p className="mt-4 font-display text-lg font-bold uppercase">Saradnja</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Za saradnju nam se javite, otvoreni smo za nove ideje i projekte.
            </p>
            <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Predložite saradnju <ArrowUpRight className="size-4" />
            </p>
          </a>
        </section>

        {/* Obrazac + saradnja */}
        <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="border-b-2 border-primary pb-1.5">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                Za saradnju nam se javite
              </h2>
            </div>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-foreground/90">
              Korner BiH je sportski portal koji prati fudbal, košarku i ostale sportove iz Bosne i
              Hercegovine, od vijesti i rezultata do statistika, tabela i historije. Stalno rastemo
              i otvoreni smo za svaku ideju koja može biti korisna čitaocima.
            </p>
            <div className="mt-6 grid gap-4">
              {WAYS.map((w) => (
                <div key={w.title} className="flex gap-4 rounded-lg border border-border p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <w.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold uppercase">{w.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{w.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={submit}
            className="h-fit rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
          >
            <h2 className="font-display text-2xl font-bold uppercase">Pošaljite poruku</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Popunite polja i otvorit će se vaša mail aplikacija s gotovom porukom.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Ime i prezime
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${field} mt-1.5`}
                  placeholder="Vaše ime"
                />
              </label>
              <label className="block text-sm font-medium">
                Vaš email
                <input
                  type="email"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className={`${field} mt-1.5`}
                  placeholder="ime@email.com"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium">
              Tema
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`${field} mt-1.5`}
              >
                <option>Saradnja</option>
                <option>Oglašavanje</option>
                <option>Želim pisati za Korner</option>
                <option>Vijest ili rezultat</option>
                <option>Ispravka podataka</option>
                <option>Ostalo</option>
              </select>
            </label>
            <label className="mt-4 block text-sm font-medium">
              Poruka
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${field} mt-1.5 resize-y`}
                placeholder="Napišite nam šta imate na umu…"
              />
            </label>
            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:opacity-90"
            >
              <Send className="size-4" /> Pošalji poruku
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Ili direktno na{" "}
              <a href={`mailto:${EMAIL}`} className="font-medium text-primary underline underline-offset-4">
                {EMAIL}
              </a>
            </p>
          </form>
        </section>

        {/* Pitanja */}
        <section className="mt-14">
          <div className="border-b-2 border-primary pb-1.5">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">
              Česta pitanja
            </h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-lg border border-border bg-surface p-4 open:border-primary"
              >
                <summary className="cursor-pointer list-none font-display text-base font-bold marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <span className="text-primary transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
