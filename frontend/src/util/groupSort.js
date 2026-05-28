const ROMAN_VALUES = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
  XIII: 13,
};

function groupSortValue(group) {
  const match = group.name?.match(/^Grupo\s+([IVX]+)$/i);
  return match ? ROMAN_VALUES[match[1].toUpperCase()] ?? Infinity : Infinity;
}

export function compareGroups(a, b) {
  const byRoman = groupSortValue(a) - groupSortValue(b);
  if (byRoman !== 0) return byRoman;
  return (a.name || "").localeCompare(b.name || "");
}
