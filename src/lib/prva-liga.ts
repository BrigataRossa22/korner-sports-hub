// Prva liga BiH: sezone prije Premijer lige (1994/95 do 2001/02).
// Ne računaju se u vječnu listu i nemaju se u kartici "WWIN liga", nego u kartici "Prva liga BiH".
export function isPrvaLiga(season: string): boolean {
  const y = Number.parseInt(season.slice(0, 4), 10);
  return Number.isFinite(y) && y < 2002;
}
