const PREFIXES = new Set(["fk", "nk", "hsk", "hnk", "sk", "gnk", "fc", "nogometni", "klub"]);

export function normClub(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !PREFIXES.has(w))
    .join(" ");
}

export function sameClub(a: string, b: string): boolean {
  const x = normClub(a);
  const y = normClub(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return y.startsWith(x + " ") || x.startsWith(y + " ");
}
