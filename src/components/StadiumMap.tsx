import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    L?: any;
  }
}

type Stadium = { name: string; seen: number };
type Pt = { lat: number; lng: number } | null;

const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist/";
let leafletP: Promise<any> | null = null;

/** Učitava biblioteku za mapu (Leaflet) tek kad zatreba. */
function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.L) return Promise.resolve(window.L);
  if (!leafletP) {
    leafletP = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = `${LEAFLET}leaflet.css`;
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = `${LEAFLET}leaflet.js`;
      js.onload = () => resolve(window.L);
      js.onerror = () => {
        leafletP = null;
        reject(new Error("leaflet"));
      };
      document.head.appendChild(js);
    });
  }
  return leafletP;
}

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

/** Mapa BiH sa stadionima na kojima je član bio. */
export function StadiumMap({ stadiums }: { stadiums: Stadium[] }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pts, setPts] = useState<Record<string, Pt>>({});
  const [todo, setTodo] = useState(0);

  const sig = stadiums.map((s) => s.name).join("|");

  // Mapa
  useEffect(() => {
    let dead = false;
    loadLeaflet()
      .then((L) => {
        if (dead || !box.current || mapRef.current) return;
        const map = L.map(box.current, { scrollWheelZoom: false }).setView([43.9, 17.9], 7);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: "© OpenStreetMap",
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      dead = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, []);

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

  // Oznake na mapi
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;
    layer.clearLayers();
    const latlngs: [number, number][] = [];
    for (const s of stadiums) {
      const p = pts[s.name];
      if (!p) continue;
      latlngs.push([p.lat, p.lng]);
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:30px;height:30px;border-radius:9999px;background:#0f5132;color:#fff;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font:700 13px sans-serif">${s.seen}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const el = document.createElement("div");
      el.textContent = `${s.name} · ${s.seen}×`;
      L.marker([p.lat, p.lng], { icon }).bindPopup(el).addTo(layer);
    }
    if (latlngs.length === 1) map.setView(latlngs[0], 12);
    else if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [30, 30], maxZoom: 12 });
  }, [ready, pts, stadiums]);

  const notFound = stadiums.filter((s) => s.name in pts && pts[s.name] === null).map((s) => s.name);
  const found = stadiums.filter((s) => pts[s.name]).length;

  return (
    <div>
      <div className="isolate overflow-hidden rounded-xl border border-border">
        <div ref={box} className="h-[22rem] w-full bg-muted sm:h-[30rem]" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {failed
          ? "Mapa se nije mogla učitati. Provjeri vezu i osvježi stranicu."
          : todo > 0
            ? `Tražim položaj stadiona… još ${todo}`
            : `Stadiona na mapi: ${found} od ${stadiums.length}. Broj u krugu je koliko si puta bio.`}
      </p>
      {notFound.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Nije pronađeno na mapi: {notFound.join(", ")}.
        </p>
      )}
    </div>
  );
}
