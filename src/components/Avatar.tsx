/** Slika profila; ako je nema, inicijali na zelenom krugu. */
export function Avatar({
  url,
  name,
  className = "size-11 text-base",
}: {
  url?: string;
  name: string;
  className?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${className} shrink-0 rounded-full bg-muted object-cover`}
      />
    );
  }
  return (
    <div
      className={`${className} grid shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground`}
      aria-hidden="true"
    >
      {name.slice(0, 2).toUpperCase() || "?"}
    </div>
  );
}
