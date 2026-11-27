import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { timeAgo } from "@/components/ArticleCard";
import { openMemberLogin } from "@/components/MemberLock";
import { commentsTable, useComments } from "@/lib/use-comments";
import { useMembership } from "@/lib/use-membership";

const MAX = 1000;

/** Komentari ispod vijesti: čita svako, piše samo prijavljen član s nadimkom. */
export function Comments({ slug }: { slug: string }) {
  const m = useMembership();
  const c = useComments(slug);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setMsg("");
    const { error } = await commentsTable().insert({
      slug,
      body,
      nick: m.nick,
      avatar_url: m.avatarUrl || null,
    });
    setBusy(false);
    if (error) {
      setMsg("Komentar nije poslan. Pokušaj ponovo.");
      return;
    }
    setText("");
    await c.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Obrisati komentar?")) return;
    const { error } = await commentsTable().delete().eq("id", id);
    if (error) {
      setMsg("Brisanje nije uspjelo.");
      return;
    }
    await c.refresh();
  }

  return (
    <section id="komentari" className="mt-12">
      <div className="border-b-2 border-primary pb-1.5">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">
          Komentari ({c.rows.length})
        </h2>
      </div>

      <div className="mt-4">
        {m.loading ? null : !m.signedIn ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <p className="text-muted-foreground">Prijavi se da bi mogao komentarisati.</p>
            <button
              type="button"
              onClick={openMemberLogin}
              className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Prijavi se
            </button>
          </div>
        ) : !m.nick ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <p className="text-muted-foreground">
              Prije prvog komentara izaberi nadimak u svom profilu.
            </p>
            <a
              href="/moj-profil"
              className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Postavi nadimak
            </a>
          </div>
        ) : (
          <div className="flex gap-3">
            <Avatar url={m.avatarUrl} name={m.nick} className="size-10 text-sm" />
            <div className="min-w-0 flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX))}
                rows={3}
                placeholder="Napiši komentar…"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {text.length}/{MAX}
                </span>
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={busy || !text.trim()}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Šaljem…" : "Objavi"}
                </button>
              </div>
              {msg && <p className="mt-2 text-sm text-destructive">{msg}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 divide-y divide-border">
        {c.loading ? (
          <p className="py-4 text-sm text-muted-foreground">Učitavam komentare…</p>
        ) : c.rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Još nema komentara. Budi prvi.</p>
        ) : (
          c.rows.map((r) => (
            <article key={r.id} className="flex gap-3 py-4">
              <Avatar url={r.avatar_url ?? ""} name={r.nick} className="size-9 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{r.nick}</span>
                  <span className="ml-2 text-xs text-muted-foreground" suppressHydrationWarning>
                    {timeAgo(r.created_at)}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{r.body}</p>
                {(r.user_id === m.userId || m.isAdmin) && (
                  <button
                    type="button"
                    onClick={() => void remove(r.id)}
                    className="mt-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Obriši
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
