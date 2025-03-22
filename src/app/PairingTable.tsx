"use client";
import React, { useState } from "react";
import { Pairing } from "./parser";
import FlightDisplay from "./FlightDisplay";

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
    excludedDays: new Set<number>(), // Days to exclude (1=Monday, 7=Sunday)
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
      // Check if flight operates on any excluded days
      const hasExcludedDay = flight.daysOfWeek?.some(day => filters.excludedDays.has(day)) ?? false;
      if (hasExcludedDay) return false;

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
      <div className="mb-4">
        <label className="font-medium block mb-2">Exclude Days</label>
        <div className="flex flex-wrap gap-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <label key={day} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.excludedDays.has(index + 1)}
                onChange={(e) => {
                  const newExcludedDays = new Set(filters.excludedDays);
                  if (e.target.checked) {
                    newExcludedDays.add(index + 1);
                  } else {
                    newExcludedDays.delete(index + 1);
                  }
                  setFilters({ ...filters, excludedDays: newExcludedDays });
                }}
                className="rounded"
              />
              {day}
            </label>
          ))}
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
                    <FlightDisplay flight={flight} />
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
