import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "theme";

/** Dugme za prebacivanje između svijetlog i tamnog načina. Izbor se pamti u browseru. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  // Pročitaj stvarno stanje tek u browseru (da se izbjegne razlika sa serverom)
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* ignoriši */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Prebaci na svijetli način" : "Prebaci na tamni način"}
      title={dark ? "Svijetli način" : "Tamni način"}
      className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-foreground/80 hover:bg-white/10 hover:text-ink-foreground"
    >
      {ready && dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {ready && dark ? "Svijetli način" : "Tamni način"}
    </button>
  );
}
