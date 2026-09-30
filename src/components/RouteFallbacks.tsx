import { Link } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

export function LoadError({ error }: ErrorComponentProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold">Podaci se ne učitavaju</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Pokušaj da osvježiš stranicu za koji trenutak."}
      </p>
      <Link
        to="/"
        className="mt-6 inline-block bg-primary px-5 py-2.5 font-display text-sm uppercase tracking-wide text-primary-foreground"
      >
        Naslovnica
      </Link>
    </div>
  );
}

export function ArticleMissing() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold">Vijest nije pronađena</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tekst je možda obrisan ili je adresa pogrešna.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block bg-primary px-5 py-2.5 font-display text-sm uppercase tracking-wide text-primary-foreground"
      >
        Nazad na naslovnicu
      </Link>
    </div>
  );
}
