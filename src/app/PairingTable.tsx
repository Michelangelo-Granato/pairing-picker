"use client";
import React, { useState } from "react";
import { Pairing, Flight } from "./parser";

interface PairingTableProps {
  data: Pairing[];
}

const PairingTable: React.FC<PairingTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Pairing;
    direction: "ascending" | "descending";
  } | null>(null);
  const [filters, setFilters] = useState({
    departureTimeAfter: "",
    departureTimeCondition: "greater",
    arrivalTimeBefore: "",
    arrivalTimeCondition: "less",
  });

  const headers: { key: keyof Pairing; label: string }[] = [
    { key: "pairingNumber", label: "Pairing Number" },
    { key: "operatingDates", label: "Operating Dates" },
    { key: "blockTime", label: "Total Flight Credit" },
    { key: "tafb", label: "TAFB" },
    { key: "totalAllowance", label: "Total Allowance" },
  ];

  const sortedData = React.useMemo(() => {
    const sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
          return sortConfig.direction === "ascending"
            ? Number(aValue) - Number(bValue)
            : Number(bValue) - Number(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const filteredData = sortedData.filter((item) => {
    const searchTermLower = searchTerm.toLowerCase();
    
    // Check pairing number and operating dates
    const matchesBasicInfo = 
      item.pairingNumber.toLowerCase().includes(searchTermLower) ||
      item.operatingDates.toLowerCase().includes(searchTermLower);

    // Check flights for airports and layovers
    const matchesFlights = item.flights.some(flight => {
      const matchesAirports = 
        flight.departure.toLowerCase().includes(searchTermLower) ||
        flight.arrival.toLowerCase().includes(searchTermLower);
      
      const matchesLayover = flight.hasLayover && 
        flight.layover?.hotel.toLowerCase().includes(searchTermLower);
      
      return matchesAirports || matchesLayover;
    });

    const matchesFilters = item.flights.every((flight) => {
      const departureTimeAfter =
        !filters.departureTimeAfter ||
        (filters.departureTimeCondition === "greater"
          ? flight.departureTime >= filters.departureTimeAfter
          : flight.departureTime <= filters.departureTimeAfter);
      const arrivalTimeBefore =
        !filters.arrivalTimeBefore ||
        (filters.arrivalTimeCondition === "less"
          ? flight.arrivalTime <= filters.arrivalTimeBefore
          : flight.arrivalTime >= filters.arrivalTimeBefore);
      return departureTimeAfter && arrivalTimeBefore;
    });

    return (matchesBasicInfo || matchesFlights) && matchesFilters;
  });

  const requestSort = (key: keyof Pairing) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Pairing) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "ascending" ? "▲" : "▼";
  };

  // Format time to 24h format (e.g., "0815" -> "08:15")
  const formatTime = (time: string) => {
    const hours = time.substring(0, 2);
    const minutes = time.substring(2, 4);
    return `${hours}:${minutes}`;
  };

  // Format duration in hours and minutes (e.g., "1050" -> "10h 50m")
  const formatDuration = (duration: string) => {
    const hours = Math.floor(parseInt(duration) / 100);
    const minutes = parseInt(duration) % 100;
    return `${hours}h ${minutes}m`;
  };

  // Format cell value based on column type
  const formatCellValue = (key: keyof Pairing, value: string) => {
    if (key === 'blockTime' || key === 'tafb') {
      return formatDuration(value);
    }
    return value;
  };

  const formatFlightDisplay = (flight: Flight) => {
    const flightInfo = `${flight.departure} - ${flight.arrival} (${formatTime(flight.departureTime)} - ${formatTime(flight.arrivalTime)}) [${formatDuration(flight.flightTime)}]`;
    if (flight.hasLayover && flight.layover) {
      const layoverDuration = flight.layover.duration;
      const hours = Math.floor(parseInt(layoverDuration) / 100);
      const minutes = parseInt(layoverDuration) % 100;
      const formattedDuration = `${hours}h ${minutes}m`;
      return (
        <div className="mb-2">
          {flightInfo}
          <div className="text-sm text-gray-300 mt-1">
            Layover: {flight.layover.hotel} ({formattedDuration})
          </div>
        </div>
      );
    }
    return <div className="mb-2">{flightInfo}</div>;
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border rounded"
      />
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-medium">Departure Time</label>
          <div className="flex items-center gap-2">
            <select
              value={filters.departureTimeCondition}
              onChange={(e) =>
                setFilters({ ...filters, departureTimeCondition: e.target.value })
              }
              className="p-2 border rounded"
            >
              <option value="greater">After</option>
              <option value="less">Before</option>
            </select>
            <input
              type="time"
              value={filters.departureTimeAfter}
              onChange={(e) =>
                setFilters({ ...filters, departureTimeAfter: e.target.value })
              }
              className="p-2 border rounded"
            />
            {filters.departureTimeAfter && (
              <button
                onClick={() => setFilters({ ...filters, departureTimeAfter: "" })}
                className="p-2 text-red-500 hover:text-red-700"
                title="Clear departure time"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium">Arrival Time</label>
          <div className="flex items-center gap-2">
            <select
              value={filters.arrivalTimeCondition}
              onChange={(e) =>
                setFilters({ ...filters, arrivalTimeCondition: e.target.value })
              }
              className="p-2 border rounded"
            >
              <option value="less">Before</option>
              <option value="greater">After</option>
            </select>
            <input
              type="time"
              value={filters.arrivalTimeBefore}
              onChange={(e) =>
                setFilters({ ...filters, arrivalTimeBefore: e.target.value })
              }
              className="p-2 border rounded"
            />
            {filters.arrivalTimeBefore && (
              <button
                onClick={() => setFilters({ ...filters, arrivalTimeBefore: "" })}
                className="p-2 text-red-500 hover:text-red-700"
                title="Clear arrival time"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
      <table className="min-w-full bg-gray-600 border-collapse">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                onClick={() => requestSort(header.key)}
                className="border-b p-2 cursor-pointer w-[120px]"
              >
                {header.label} {getSortIndicator(header.key)}
              </th>
            ))}
            <th className="border-b p-2 w-[500px]">Flights</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={index} className="border-b text-center">
              {headers.map((header) => (
                <td key={header.key} className="p-2 border-b">
                  {formatCellValue(header.key, String(item[header.key]))}
                </td>
              ))}
              <td className="p-2 border-b text-left">
                {item.flights.map((flight, idx) => (
                  <div key={idx}>
                    {formatFlightDisplay(flight)}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PairingTable;
