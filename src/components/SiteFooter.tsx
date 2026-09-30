import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/korner-logo.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 font-display text-2xl font-bold uppercase">
            <img src={logoAsset.url} alt="Korner BiH logo" className="size-8 rounded-md" />
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
              <Link to="/fudbal">Fudbal</Link>
            </li>
            <li>
              <Link to="/kosarka">Košarka</Link>
            </li>
            <li>
              <Link to="/ostali-sportovi">Ostali sportovi</Link>
            </li>
            <li>
              <Link to="/o-nama">O nama</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-[0.15em] text-primary">Pratite nas</p>
          <a
            href="https://www.instagram.com/korner_bih/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm text-ink-foreground/75 underline underline-offset-4"
          >
            Instagram @korner_bih
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ink-foreground/50">
        © {new Date().getFullYear()} Korner BiH. Sva prava zadržana.
      </div>
    </footer>
  );
}
