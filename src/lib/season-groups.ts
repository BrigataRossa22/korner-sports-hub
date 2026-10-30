// Redoslijed grupa/faza u sezonama koje imaju više tabela (npr. 1994/95):
// prvo grupe, zatim pretkolo play-offa, na kraju finalna grupa.
export function groupRank(name: string): number {
  if (/finaln/i.test(name)) return 3;
  if (/pretkol|play-?off|bara/i.test(name)) return 2;
  return 1;
}

export function compareGroups(a: string, b: string): number {
  return groupRank(a) - groupRank(b) || a.localeCompare(b, "bs");
}
