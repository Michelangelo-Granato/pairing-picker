import { loadFavorites, saveFavorites, toggleFavorite } from './favorites';

describe('favorites utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('toggleFavorite', () => {
    it('should add a new favorite', () => {
      const favorites = new Set<string>();
      const newFavorites = toggleFavorite(favorites, 'T5001');
      expect(newFavorites.has('T5001')).toBe(true);
    });

    it('should remove an existing favorite', () => {
      const favorites = new Set(['T5001']);
      const newFavorites = toggleFavorite(favorites, 'T5001');
      expect(newFavorites.has('T5001')).toBe(false);
    });

    it('should not modify the original set', () => {
      const favorites = new Set(['T5001']);
      toggleFavorite(favorites, 'T5001');
      expect(favorites.has('T5001')).toBe(true);
    });
  });

  describe('saveFavorites and loadFavorites', () => {
    it('should save and load favorites from localStorage', () => {
      const favorites = new Set(['T5001', 'T5002']);
      saveFavorites(favorites);
      const loaded = loadFavorites();
      expect(loaded).toEqual(favorites);
    });

    it('should return empty set when no favorites are saved', () => {
      const loaded = loadFavorites();
      expect(loaded).toEqual(new Set());
    });

    it('should handle empty set', () => {
      const favorites = new Set<string>();
      saveFavorites(favorites);
      const loaded = loadFavorites();
      expect(loaded).toEqual(favorites);
    });
  });
});