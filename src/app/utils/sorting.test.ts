import { sortPairings, SortConfig } from './sorting';
import { Pairing } from '../types';

describe('sortPairings', () => {
  const mockPairings: Pairing[] = [
    {
      pairingNumber: "T5002",
      operatingDates: "15APR - 25APR",
      flights: [],
      blockTime: "1200",
      tafb: "1500",
      totalAllowance: "100.00",
      layovers: 0
    },
    {
      pairingNumber: "T5001",
      operatingDates: "14APR - 24APR",
      flights: [],
      blockTime: "1000",
      tafb: "1300",
      totalAllowance: "80.00",
      layovers: 0
    }
  ];

  it('should return original array if sortConfig is null', () => {
    expect(sortPairings(mockPairings, null)).toEqual(mockPairings);
  });

  it('should sort strings in ascending order', () => {
    const config: SortConfig = { key: 'pairingNumber', direction: 'ascending' };
    const sorted = sortPairings(mockPairings, config);
    expect(sorted[0].pairingNumber).toBe('T5001');
    expect(sorted[1].pairingNumber).toBe('T5002');
  });

  it('should sort strings in descending order', () => {
    const config: SortConfig = { key: 'pairingNumber', direction: 'descending' };
    const sorted = sortPairings(mockPairings, config);
    expect(sorted[0].pairingNumber).toBe('T5002');
    expect(sorted[1].pairingNumber).toBe('T5001');
  });

  it('should sort numeric strings as numbers in ascending order', () => {
    const config: SortConfig = { key: 'blockTime', direction: 'ascending' };
    const sorted = sortPairings(mockPairings, config);
    expect(sorted[0].blockTime).toBe('1000');
    expect(sorted[1].blockTime).toBe('1200');
  });

  it('should sort numeric strings as numbers in descending order', () => {
    const config: SortConfig = { key: 'blockTime', direction: 'descending' };
    const sorted = sortPairings(mockPairings, config);
    expect(sorted[0].blockTime).toBe('1200');
    expect(sorted[1].blockTime).toBe('1000');
  });
});