import { Lock } from "lucide-react";

/** Otvara prozor za prijavu u izborniku "Korner članstvo" (gore desno). */
export function openMemberLogin() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("korner:login"));
}

const INSTAGRAM = "https://www.instagram.com/korner_bih/";

/** Cijela stranica zaključana: ključ, poruka i dugme za prijavu. */
export function LockedPage({ title }: { title: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="size-9" strokeWidth={1.75} />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold uppercase">Zaključano</h1>
      <p className="mt-3 text-base font-medium">Otključajte uz Korner članstvo</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Ova stranica je dostupna članovima. Ako već imaš profil, prijavi se, a ako ga nemaš, javi nam
        se.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={openMemberLogin}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Prijavi se
        </button>
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted"
        >
          Postani član
        </a>
      </div>
    </div>
  );
}

/** Manji zaključani blok unutar stranice (npr. u prozoru s međusobnim omjerom). */
export function LockedBox() {
  return (
    <div className="flex flex-col items-center px-2 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="size-6" strokeWidth={1.75} />
      </div>
      <p className="mt-4 text-sm font-semibold">Otključajte uz Korner članstvo</p>
      <p className="mt-1 text-xs text-muted-foreground">Međusobni omjer je dostupan članovima.</p>
      <button
        type="button"
        onClick={openMemberLogin}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Prijavi se
      </button>
    </div>
  );
}
