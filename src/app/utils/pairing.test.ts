import { getFlightsPerDay } from './pairing';
import { Pairing } from '../types';

describe('getFlightsPerDay', () => {
  it('should return 0 for an empty pairing', () => {
    const emptyPairing: Pairing = {
      pairingNumber: '1',
      operatingDates: '2024-03-22',
      flights: [],
      layovers: 0,
      blockTime: '0000',
      tafb: '0000',
      totalAllowance: '0000'
    };
    expect(getFlightsPerDay(emptyPairing)).toBe(0);
  });

  it('should correctly count flights per day', () => {
    const pairing: Pairing = {
      pairingNumber: '1',
      operatingDates: '2024-03-22',
      flights: [
        {
          aircraft: 'B737',
          flightNumber: '123',
          departure: 'LAX',
          arrival: 'JFK',
          departureTime: '10:00',
          arrivalTime: '18:00',
          flightTime: '0800',
          dutyTime: '0800',
          daysOfWeek: [1, 2, 3],
          hasLayover: false,
          layover: null
        },
        {
          aircraft: 'B737',
          flightNumber: '456',
          departure: 'JFK',
          arrival: 'LAX',
          departureTime: '19:00',
          arrivalTime: '23:00',
          flightTime: '0600',
          dutyTime: '0600',
          daysOfWeek: [1, 2, 3, 4],
          hasLayover: false,
          layover: null
        }
      ],
      layovers: 0,
      blockTime: '1400',
      tafb: '1400',
      totalAllowance: '1400'
    };
    expect(getFlightsPerDay(pairing)).toBe(2); // Day 1, 2, and 3 have 2 flights each
  });
}); 