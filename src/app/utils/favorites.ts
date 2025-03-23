const FAVORITES_KEY = 'favoritePairings';

export function loadFavorites(): Set<string> {
  const savedFavorites = localStorage.getItem(FAVORITES_KEY);
  if (savedFavorites) {
    return new Set(JSON.parse(savedFavorites));
  }
  return new Set();
}

export function saveFavorites(favorites: Set<string>): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
}

export function toggleFavorite(favorites: Set<string>, pairingNumber: string): Set<string> {
  const next = new Set(favorites);
  if (next.has(pairingNumber)) {
    next.delete(pairingNumber);
  } else {
    next.add(pairingNumber);
  }
  return next;
}