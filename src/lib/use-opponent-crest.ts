import { useEffect, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOpponentCrest } from "@/lib/opponentcrest.functions";
import { getOpponentCrestsDb } from "@/lib/opponentcrestsdb.functions";

// Grbovi evropskih protivnika: prvo iz baze (tabela opponent_crests), a za klubove kojih tamo
// nema traže se automatski u TheSportsDB i pamte u pregledniku.

const STORE_KEY = "korner-opponent-crests-v2";
const MISS_TTL = 7 * 24 * 3600 * 1000;
const GAP_MS = 2300;
const RATE_WAIT_MS = 65000;

type Entry = { url: string; at: number };

const cache = new Map<string, Entry>();
const pending = new Set<string>();
const queue: string[] = [];
const listeners = new Set<() => void>();
let version = 0;
let running = false;
let loaded = false;

function keyOf(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function emit(): void {
  version++;
  listeners.forEach((l) => l());
}

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, Entry>;
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v.url === "string" && typeof v.at === "number") cache.set(k, v);
    }
    emit();
  } catch {
    /* bez keša stranica radi isto */
  }
}

function save(): void {
  try {
    const obj: Record<string, Entry> = {};
    cache.forEach((v, k) => {
      obj[k] = v;
    });
    window.localStorage.setItem(STORE_KEY, JSON.stringify(obj));
  } catch {
    /* ignoriši */
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function variants(name: string): string[] {
  const base = name.trim();
  const stripped = base
    .replace(/^(fc|fk|sk|nk|cf|ac|as|ss|sc|bk|if|kf|hnk|gnk)\s+/i, "")
    .replace(/\s+(fc|fk|sk|cf|ac)$/i, "")
    .trim();
  return stripped && stripped !== base ? [base, stripped] : [base];
}

async function fetchBadge(query: string): Promise<string> {
  const r = await getOpponentCrest({ data: { query } });
  if (r.status === "rate") throw new Error("rate");
  if (r.status === "error") throw new Error("http");
  return r.url;
}

async function run(): Promise<void> {
  if (running) return;
  running = true;
  while (queue.length) {
    const name = queue.shift()!;
    const k = keyOf(name);
    let url = "";
    let failed = false;
    try {
      for (const q of variants(name)) {
        url = await fetchBadge(q);
        if (url) break;
        await sleep(GAP_MS);
      }
    } catch (e) {
      failed = true;
      if (e instanceof Error && e.message === "rate") {
        queue.unshift(name);
        await sleep(RATE_WAIT_MS);
        continue;
      }
    }
    pending.delete(k);
    if (!failed) {
      cache.set(k, { url, at: Date.now() });
      save();
      emit();
    }
    await sleep(GAP_MS);
  }
  running = false;
}

function request(name: string): void {
  const k = keyOf(name);
  if (!k) return;
  const e = cache.get(k);
  if (e && (e.url || Date.now() - e.at < MISS_TTL)) return;
  if (pending.has(k)) return;
  pending.add(k);
  queue.push(name);
  void run();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Vraća funkciju: ime protivnika -> adresa grba ("" ako ga nema). */
export function useOpponentCrests(names: string[]): (name: string) => string {
  useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
  const { data: dbRows, isSuccess } = useQuery({
    queryKey: ["opponent-crests-db"],
    queryFn: () => getOpponentCrestsDb(),
    staleTime: Infinity,
  });
  const db = new Map<string, string>();
  for (const r of dbRows ?? []) if (r.url) db.set(r.key, r.url);

  const sig = names.join("|");
  const dbSize = db.size;
  useEffect(() => {
    ensureLoaded();
    if (!isSuccess) return;
    for (const n of sig.split("|")) {
      if (!db.has(keyOf(n))) request(n);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, isSuccess, dbSize]);

  return (name: string) => {
    const k = keyOf(name);
    return db.get(k) ?? cache.get(k)?.url ?? "";
  };
}
