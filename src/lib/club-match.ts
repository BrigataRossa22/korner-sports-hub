const PREFIXES = new Set(["fk", "nk", "hsk", "hnk", "sk", "gnk", "fc", "nogometni", "klub"]);

// Isti klub pod različitim imenima kroz historiju: normalizovano ime -> zajedničko normalizovano ime.
// Novi slučaj dodaješ kao jedan red.
const ALIASES: Record<string, string> = {
  "zovko zepce": "zepce",
  "zepce limorad": "zepce",
  "alfa modrica": "modrica",
  "modrica alfa": "modrica",
  "modrica maxima": "modrica",
  // Drina Zvornik 93 (Živinice), 1997-2000: drugi klub nego današnja Drina Zvornik
  "drina zvornik zivinice": "zivinice drina",
  "drina zvornik 93": "zivinice drina",
  // HNK Ljubuški (do 2005) i Sloga Ljubuški (2014-16) su isti klub pod različitim imenom.
  // Današnji NK Ljubuški je drugi klub i u bazi se zove "NK Ljubuški (novi)".
  ljubuski: "sloga ljubuski",
};

// Ime koje se prikazuje za spojeni klub (ključ je zajedničko normalizovano ime)
const DISPLAY: Record<string, string> = {
  zepce: "Žepče",
  modrica: "Modriča",
  "zivinice drina": "Drina Zvornik 93",
  "sloga ljubuski": "Ljubuški",
};

export function normClub(s: string): string {
  const n = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !PREFIXES.has(w))
    .join(" ");
  return ALIASES[n] ?? n;
}

/** Ime za prikaz: za spojene klubove jedno zajedničko ime, inače ime kakvo jeste. */
export function displayClub(name: string): string {
  return DISPLAY[normClub(name)] ?? name;
}

export function sameClub(a: string, b: string): boolean {
  const x = normClub(a);
  const y = normClub(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return y.startsWith(x + " ") || x.startsWith(y + " ");
}
