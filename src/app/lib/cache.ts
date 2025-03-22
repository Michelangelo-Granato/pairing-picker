import { cache } from 'react';
import { Pairing } from '../parser';

export interface CachedPairingList {
  yearMonth: string;
  pairings: Pairing[];
  timestamp: number;
}

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// In-memory cache for server
const pairingCache = new Map<string, CachedPairingList>();

export const getCachedPairings = cache(async (yearMonth: string): Promise<CachedPairingList | null> => {
  const cached = pairingCache.get(yearMonth);
  
  // Return cached data if it exists and hasn't expired
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }
  
  // If cache expired, remove it
  if (cached) {
    pairingCache.delete(yearMonth);
  }
  
  return null;
});

export const setCachedPairings = cache(async (yearMonth: string, pairings: Pairing[]): Promise<void> => {
  const cachedData: CachedPairingList = {
    yearMonth,
    pairings,
    timestamp: Date.now()
  };
  
  pairingCache.set(yearMonth, cachedData);
}); 