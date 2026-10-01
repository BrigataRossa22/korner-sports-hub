import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { contentOptions } from "@/lib/content";
import { useHydrated } from "@/lib/use-hydrated";

export function SiteFooter() {
  const hydrated = useHydrated();
  const { data } = useQuery({ ...contentOptions, enabled: hydrated });
  const settings = data?.settings;

  return (
    <footer className="mt-16 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 font-display text-2xl font-bold uppercase">
            <img src="/korner-logo.png" alt="Korner BiH logo" className="size-8 rounded-md" />
            Korner
          </p>
          <p className="mt-2 max-w-xs text-sm text-ink-foreground/70">
            Sportski portal iz Bosne i Hercegovine. Fudbal, košarka i sve što se dešava na terenu i
            oko njega.
          </p>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-[0.15em] text-primary">Rubrike</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-foreground/75">
            <li>
              <Link to="/wwin-liga">WWiN liga</Link>
            </li>
            <li>
              <Link to="/tabela">Tabela</Link>
            </li>
            <li>
              <Link to="/reprezentacija">Reprezentacija</Link>
            </li>
            <li>
              <Link to="/nize-lige">Niže lige</Link>
            </li>
            <li>
              <Link to="/o-nama">O nama</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-[0.15em] text-primary">
            Pratite nas
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-foreground/75">
            {settings?.instagram && (
              <li>
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  Instagram
                </a>
              </li>
            )}
            {settings?.facebook && (
              <li>
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  Facebook
                </a>
              </li>
            )}
            {settings?.contactEmail && (
              <li>
                <a href={`mailto:${settings.contactEmail}`} className="underline underline-offset-4">
                  {settings.contactEmail}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ink-foreground/50">
        © {new Date().getFullYear()} Korner BiH. Sva prava zadržana.
        <span className="mx-2">·</span>
        <Link to="/auth" className="underline underline-offset-4 hover:text-ink-foreground">
          Prijava za urednike
        </Link>
      </div>
    </footer>
  );
}
