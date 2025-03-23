import { Pairing } from "../types";

export type SortConfig = {
  key: keyof Pairing;
  direction: "ascending" | "descending";
};

export function sortPairings(pairings: Pairing[], sortConfig: SortConfig | null): Pairing[] {
  if (!sortConfig) return pairings;

  return [...pairings].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const numA = Number(aValue);
      const numB = Number(bValue);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.direction === "ascending"
          ? numA - numB
          : numB - numA;
      }
      
      return sortConfig.direction === "ascending"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return 0;
  });
}