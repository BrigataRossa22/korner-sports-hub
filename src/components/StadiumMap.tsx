import { useEffect, useMemo, useState } from "react";

type Stadium = { name: string; seen: number };
type Pt = { lat: number; lng: number } | null;

// Pojednostavljena granica BiH (dužina, širina)
const OUTLINE: [number, number][] = [
  [15.74, 45.19], [16.05, 45.22], [16.38, 45.04], [16.8, 45.19], [17.25, 45.14], [17.65, 45.12],
  [18.0, 45.15], [18.45, 45.08], [18.8, 44.87], [19.05, 44.93], [19.35, 45.0], [19.62, 44.88],
  [19.33, 44.62], [19.1, 44.4], [19.35, 44.2], [19.3, 43.95], [19.35, 43.6], [19.0, 43.52],
  [18.85, 43.3], [18.55, 43.15], [18.45, 42.95], [18.5, 42.65], [18.44, 42.56], [18.2, 42.64],
  [18.0, 42.75], [17.7, 42.92], [17.58, 42.98], [17.45, 43.1], [17.3, 43.3], [17.2, 43.5],
  [16.8, 43.75], [16.65, 44.0], [16.25, 44.1], [16.15, 44.35], [15.95, 44.6], [15.78, 44.75],
  [15.72, 44.95],
];

const W = 580;
const H = 580;
const K = Math.cos((44 * Math.PI) / 180);
const proj = (lng: number, lat: number): [number, number] => [
  (lng - 15.7) * K * 200 + 6,
  (45.3 - lat) * 200 + 10,
];
const PATH =
  OUTLINE.map(([lng, lat], i) => {
    const [x, y] = proj(lng, lat);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ") + " Z";

const KEY = "korner-geo-v1:";

function readCache(name: string): Pt | undefined {
  try {
    const v = localStorage.getItem(KEY + name);
    return v === null ? undefined : (JSON.parse(v) as Pt);
  } catch {
    return undefined;
  }
}

function writeCache(name: string, p: Pt) {
  try {
    localStorage.setItem(KEY + name, JSON.stringify(p));
  } catch {
    /* nije bitno */
  }
}

/** Traži položaj stadiona u OpenStreetMap bazi. */
async function geocode(name: string): Promise<Pt> {
  const q = encodeURIComponent(`${name}, Bosna i Hercegovina`);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ba&accept-language=bs&q=${q}`,
  );
  if (!res.ok) throw new Error("geo");
  const rows = (await res.json()) as { lat: string; lon: string }[];
  const r = rows[0];
  return r ? { lat: Number(r.lat), lng: Number(r.lon) } : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const inside = (p: Pt) => !!p && p.lng > 15.5 && p.lng < 19.8 && p.lat > 42.4 && p.lat < 45.4;

/** Jednostavna zelena karta BiH sa stadionima na kojima je član bio. */
export function StadiumMap({ stadiums }: { stadiums: Stadium[] }) {
  const [pts, setPts] = useState<Record<string, Pt>>({});
  const [todo, setTodo] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const sig = stadiums.map((s) => s.name).join("|");

  // Položaji stadiona (iz memorije preglednika, a nove traži jedan po jedan)
  useEffect(() => {
    let dead = false;
    const known: Record<string, Pt> = {};
    const missing: string[] = [];
    for (const s of stadiums) {
      const c = readCache(s.name);
      if (c !== undefined) known[s.name] = c;
      else missing.push(s.name);
    }
    setPts(known);
    setTodo(missing.length);
    (async () => {
      for (let i = 0; i < missing.length; i++) {
        if (dead) return;
        const name = missing[i]!;
        try {
          const p = await geocode(name);
          writeCache(name, p);
          if (dead) return;
          setPts((prev) => ({ ...prev, [name]: p }));
        } catch {
          /* pokušat će se ponovo sljedeći put */
        }
        setTodo(missing.length - i - 1);
        await sleep(1100);
      }
    })();
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const pins = useMemo(
    () =>
      stadiums
        .filter((s) => inside(pts[s.name] ?? null))
        .map((s) => {
          const p = pts[s.name]!;
          const [x, y] = proj(p!.lng, p!.lat);
          return { ...s, x, y };
        }),
    [stadiums, pts],
  );
  // Izabrana oznaka se crta zadnja, da bude iznad ostalih
  const drawn = [...pins].sort((a, b) => Number(a.name === picked) - Number(b.name === picked));
  const notFound = stadiums.filter((s) => s.name in pts && !inside(pts[s.name] ?? null));

  return (
    <div>
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label="Karta BiH sa stadionima">
          <path
            d={PATH}
            className="fill-primary/20 stroke-primary"
            strokeWidth={3}
            strokeLinejoin="round"
          />
          {drawn.map((p) => {
            const on = p.name === picked;
            return (
              <g
                key={p.name}
                transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
                onClick={() => setPicked(on ? null : p.name)}
                className="cursor-pointer"
              >
                <circle r={24} fill="transparent" />
                <circle
                  r={on ? 19 : 16}
                  className="fill-primary stroke-white"
                  strokeWidth={3}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={16}
                  fontWeight={700}
                  className="fill-white"
                  style={{ pointerEvents: "none" }}
                >
                  {p.seen}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {todo > 0
          ? `Tražim položaj stadiona… još ${todo}`
          : "Broj u krugu je koliko si puta bio na tom stadionu. Klikni krug za ime."}
      </p>

      {picked && (
        <p className="mx-auto mt-2 w-fit rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
          {picked} · {stadiums.find((s) => s.name === picked)?.seen}×
        </p>
      )}

      <ul className="mt-4 flex flex-wrap justify-center gap-2">
        {stadiums.map((s) => (
          <li key={s.name}>
            <button
              type="button"
              onClick={() => setPicked(picked === s.name ? null : s.name)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                picked === s.name
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {s.name} · {s.seen}×
            </button>
          </li>
        ))}
      </ul>

      {notFound.length > 0 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Nije pronađeno na karti: {notFound.map((s) => s.name).join(", ")}.
        </p>
      )}
    </div>
  );
}
