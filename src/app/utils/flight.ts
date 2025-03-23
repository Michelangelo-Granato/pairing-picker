import { Airport, Pairing, Flight } from "../types";

// Create a static map for airport codes to cities
export const createAirportMap = (airports: Airport[]) => {
  const airportToCity = new Map<string, string>();
  airports.forEach(airport => {
    if (airport.iata && airport.city) {
      airportToCity.set(airport.iata.toUpperCase(), airport.city);
    }
  });
  return airportToCity;
};

// Create search index for a pairing
export const createFlightIndex = (pairing: Pairing, airportToCity: Map<string, string>) => {
  return pairing.flights.reduce((acc: string[], flight: Flight) => {
    const departureCity = airportToCity.get(flight.departure.toUpperCase()) ?? '';
    const arrivalCity = airportToCity.get(flight.arrival.toUpperCase()) ?? '';
    
    acc.push(
      flight.departure.toLowerCase(),
      departureCity.toLowerCase(),
      flight.arrival.toLowerCase(),
      arrivalCity.toLowerCase()
    );
    if (flight.hasLayover && flight.layover) {
      acc.push(flight.layover.hotel.toLowerCase());
    }
    return acc;
  }, [] as string[]).join(' ');
};

// Format duration (e.g., "130" -> "1h 30m")
export const formatDuration = (duration: string): string => {
  const hours = Math.floor(parseInt(duration) / 100);
  const minutes = parseInt(duration) % 100;
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}; 