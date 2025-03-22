"use client";
import React, { useState, useEffect } from "react";
import { Flight } from "./parser";
import airports from '../data/airports.json';

interface Airport {
  iata: string;
  city: string;
  name: string;
}

interface FlightDisplayProps {
  flight: Flight;
}

const FlightDisplay: React.FC<FlightDisplayProps> = ({ flight }) => {
  const [airportToCity, setAirportToCity] = useState<Map<string, string>>(new Map());
  const [isAirportsLoaded, setIsAirportsLoaded] = useState(false);

  useEffect(() => {
    const map = new Map<string, string>();
    (airports as Airport[]).forEach(airport => {
      if (airport.iata && airport.city) {
        map.set(airport.iata.toUpperCase(), airport.city);
      }
    });
    setAirportToCity(map);
    setIsAirportsLoaded(true);
  }, []);

  const getCityName = (code: string) => {
    if (!isAirportsLoaded) return code;
    const city = airportToCity.get(code.toUpperCase());
    if (!city) {
      console.warn(`City not found for airport code: ${code}`);
    }
    return city ?? code;
  };

  const formatTime = (time: string) => {
    const hours = time.substring(0, 2);
    const minutes = time.substring(2, 4);
    return `${hours}:${minutes}`;
  };

  const formatDuration = (duration: string) => {
    const hours = Math.floor(parseInt(duration) / 100);
    const minutes = parseInt(duration) % 100;
    return `${hours}h ${minutes}m`;
  };

  const formatDayOfWeek = (days: number[]) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Sort days numerically
    const sortedDays = [...days].sort((a, b) => a - b);
    
    // If all days are present, return Mon-Sun
    if (sortedDays.length === 7) {
      return 'Mon-Sun';
    }

    // Find continuous ranges
    const ranges: { start: number; end: number }[] = [];
    let currentRange = { start: sortedDays[0], end: sortedDays[0] };

    for (let i = 1; i < sortedDays.length; i++) {
      if (sortedDays[i] === currentRange.end + 1) {
        currentRange.end = sortedDays[i];
      } else {
        ranges.push(currentRange);
        currentRange = { start: sortedDays[i], end: sortedDays[i] };
      }
    }
    ranges.push(currentRange);

    // Format ranges
    return ranges.map(range => {
      if (range.start === range.end) {
        return dayNames[range.start - 1];
      }
      return `${dayNames[range.start - 1]}-${dayNames[range.end - 1]}`;
    }).join(', ');
  };

  const daysDisplay = flight.daysOfWeek ? formatDayOfWeek(flight.daysOfWeek) : 'No days specified';
  const departureCity = getCityName(flight.departure);
  const arrivalCity = getCityName(flight.arrival);

  return (
    <div className="mb-2">
      <div className="font-medium">
        {flight.departure} ({departureCity}) → {flight.arrival} ({arrivalCity})
      </div>
      <div className="text-sm text-gray-300">
        {daysDisplay} {formatTime(flight.departureTime)} - {formatTime(flight.arrivalTime)} [{formatDuration(flight.flightTime)}]
      </div>
      {flight.hasLayover && flight.layover && (
        <div className="text-sm text-gray-300 mt-1">
          Layover: {flight.layover.hotel} ({formatDuration(flight.layover.duration)})
        </div>
      )}
    </div>
  );
};

export default FlightDisplay; 