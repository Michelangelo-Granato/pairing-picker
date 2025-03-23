import { createAirportMap, createFlightIndex, formatDuration } from './flight';
import { Airport, Pairing } from '../types';

describe('createAirportMap', () => {
  it('should create a map of IATA codes to cities', () => {
    const airports: Airport[] = [
      { iata: 'LAX', city: 'Los Angeles', name: 'Los Angeles International' },
      { iata: 'JFK', city: 'New York', name: 'John F. Kennedy International' }
    ];
    const map = createAirportMap(airports);
    expect(map.get('LAX')).toBe('Los Angeles');
    expect(map.get('JFK')).toBe('New York');
    expect(map.get('INVALID')).toBeUndefined();
  });

  it('should handle airports without IATA codes or cities', () => {
    const airports: Airport[] = [
      { iata: 'LAX', city: 'Los Angeles', name: 'Los Angeles International' },
      { iata: '', city: 'New York', name: 'New York Airport' },
      { iata: 'JFK', city: '', name: 'John F. Kennedy International' }
    ];
    const map = createAirportMap(airports);
    expect(map.get('LAX')).toBe('Los Angeles');
    expect(map.get('')).toBeUndefined();
    expect(map.get('JFK')).toBeUndefined();
  });
});

describe('createFlightIndex', () => {
  it('should create a searchable index from a pairing', () => {
    const airportToCity = new Map([
      ['LAX', 'Los Angeles'],
      ['JFK', 'New York']
    ]);
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
          daysOfWeek: [1],
          hasLayover: false,
          layover: null
        }
      ],
      layovers: 0,
      blockTime: '0800',
      tafb: '0800',
      totalAllowance: '0800'
    };
    const index = createFlightIndex(pairing, airportToCity);
    expect(index).toContain('lax');
    expect(index).toContain('los angeles');
    expect(index).toContain('jfk');
    expect(index).toContain('new york');
  });

  it('should include layover hotel in the index', () => {
    const airportToCity = new Map([
      ['LAX', 'Los Angeles'],
      ['JFK', 'New York']
    ]);
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
          daysOfWeek: [1],
          hasLayover: true,
          layover: {
            hotel: 'Hilton Hotel',
            duration: '1200'
          }
        }
      ],
      layovers: 1,
      blockTime: '0800',
      tafb: '2000',
      totalAllowance: '2000'
    };
    const index = createFlightIndex(pairing, airportToCity);
    expect(index).toContain('hilton hotel');
  });
});

describe('formatDuration', () => {
  it('should format duration correctly', () => {
    expect(formatDuration('0130')).toBe('1h 30m');
    expect(formatDuration('0800')).toBe('8h 00m');
    expect(formatDuration('0000')).toBe('0h 00m');
  });
}); 