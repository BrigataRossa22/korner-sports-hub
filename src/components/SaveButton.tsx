import { useState } from "react";
import { Bookmark } from "lucide-react";
import { openMemberLogin } from "@/components/MemberLock";
import { useSaved } from "@/lib/use-saved";

/** Dugme "Za kasnije" na vijesti. Bez prijave otvara prijavu. */
export function SaveButton({ slug, title }: { slug: string; title: string }) {
  const s = useSaved();
  const [busy, setBusy] = useState(false);
  const saved = s.enabled && s.has(slug);

  async function onClick() {
    if (!s.enabled) {
      openMemberLogin();
      return;
    }
    setBusy(true);
    await s.toggle(slug, title);
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
        saved
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-foreground hover:bg-muted"
      }`}
    >
      <Bookmark className={`size-3.5 ${saved ? "fill-current" : ""}`} />
      {saved ? "Sačuvano" : "Za kasnije"}
    </button>
  );
}
