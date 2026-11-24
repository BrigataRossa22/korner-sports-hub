import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Membership = {
  /** Još provjeravamo prijavu i ulogu */
  loading: boolean;
  signedIn: boolean;
  userId: string;
  email: string;
  /** Nadimak koji je korisnik sam izabrao (prazno ako ga nema) */
  nick: string;
  /** Urednik (admin): vidi sve bez članstva */
  isAdmin: boolean;
  /** Ima aktivno Korner članstvo */
  isMember: boolean;
  /** Smije vidjeti zaključani sadržaj: član ili admin */
  hasAccess: boolean;
};

const LOADING: Membership = {
  loading: true,
  signedIn: false,
  userId: "",
  email: "",
  nick: "",
  isAdmin: false,
  isMember: false,
  hasAccess: false,
};

const SIGNED_OUT: Membership = { ...LOADING, loading: false };

let state: Membership = LOADING;
const listeners = new Set<() => void>();
let started = false;

function set(next: Membership) {
  state = next;
  listeners.forEach((l) => l());
}

async function load() {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      set(SIGNED_OUT);
      return;
    }
    // Korisnik čita samo svoje uloge (user_roles ima pravilo "samo svoje")
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const names = (roles ?? []).map((r) => String(r.role));
    const isAdmin = names.includes("editor");
    const isMember = names.includes("member");
    // Nadimak (tabela profiles); ako tabele još nema, samo ga preskačemo
    let nick = "";
    try {
      const { data: prof } = await (
        supabase as unknown as {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          from: (t: string) => any;
        }
      )
        .from("profiles")
        .select("nick")
        .eq("user_id", user.id)
        .maybeSingle();
      nick = String(prof?.nick ?? "");
    } catch {
      nick = "";
    }
    set({
      loading: false,
      signedIn: true,
      userId: user.id,
      email: user.email ?? "",
      nick,
      isAdmin,
      isMember,
      hasAccess: isAdmin || isMember,
    });
  } catch {
    set(SIGNED_OUT);
  }
}

/** Ponovo učitaj prijavu, uloge i nadimak (npr. nakon promjene nadimka). */
export function refreshMembership() {
  void load();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void load();
  supabase.auth.onAuthStateChange(() => {
    // odgođeno, da se ne poziva Supabase unutar njegovog vlastitog događaja
    setTimeout(() => void load(), 0);
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Prijava i Korner članstvo trenutnog posjetioca. Isto stanje dijele sve komponente. */
export function useMembership(): Membership {
  useEffect(() => {
    start();
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => LOADING,
  );
}
