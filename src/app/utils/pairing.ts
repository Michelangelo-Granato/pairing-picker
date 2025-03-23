import { Pairing } from "../types";

export function getFlightsPerDay(pairing: Pairing): number {
  if (pairing.flights.length === 0) return 0;
  
  const flightsByDay = new Map<number, number>();
  for (const flight of pairing.flights) {
    for (const day of flight.daysOfWeek) {
      flightsByDay.set(day, (flightsByDay.get(day) ?? 0) + 1);
    }
  }
  return Math.max(...Array.from(flightsByDay.values()));
} 