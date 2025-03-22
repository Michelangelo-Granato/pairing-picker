"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Pairing } from "./parser";
import FlightDisplay from "./FlightDisplay";
import DisplaySettings from "./DisplaySettings";

interface PairingTableProps {
  data: Pairing[];
  selectedPairingNumbers: Set<string>;
  onSelectionChange: (selectedPairingNumbers: Set<string>) => void;
}

const PairingTable: React.FC<PairingTableProps> = ({ 
  data, 
  selectedPairingNumbers,
  onSelectionChange 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Pairing;
    direction: "ascending" | "descending";
  } | null>(null);
  const [favoritePairings, setFavoritePairings] = useState<Set<string>>(new Set());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    "pairingNumber",
    "operatingDates",
    "blockTime",
    "tafb",
    "totalAllowance"
  ]));
  const [filters, setFilters] = useState({
    departureTimeAfter: "",
    departureTimeCondition: "greater",
    arrivalTimeBefore: "",
    arrivalTimeCondition: "less",
    excludedDays: new Set<number>(), // Days to exclude (1=Monday, 7=Sunday)
    maxFlightsPerDay: "", // New filter for maximum flights per day
    showFavoritesOnly: false, // New filter for showing only favorites
  });

  // Load favorites and display settings from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoritePairings');
    const savedVisibleColumns = localStorage.getItem('visibleColumns');
    
    if (savedFavorites) {
      setFavoritePairings(new Set(JSON.parse(savedFavorites)));
    }
    if (savedVisibleColumns) {
      setVisibleColumns(new Set(JSON.parse(savedVisibleColumns)));
    }
  }, []);

  // Save favorites and display settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('favoritePairings', JSON.stringify(Array.from(favoritePairings)));
    localStorage.setItem('visibleColumns', JSON.stringify(Array.from(visibleColumns)));
  }, [favoritePairings, visibleColumns]);

  const toggleFavorite = useCallback((pairingNumber: string) => {
    setFavoritePairings(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(pairingNumber)) {
        newFavorites.delete(pairingNumber);
      } else {
        newFavorites.add(pairingNumber);
      }
      return newFavorites;
    });
  }, []);

  const toggleColumn = useCallback((column: string) => {
    setVisibleColumns(prev => {
      const newColumns = new Set(prev);
      if (newColumns.has(column)) {
        newColumns.delete(column);
      } else {
        newColumns.add(column);
      }
      return newColumns;
    });
  }, []);

  const headers: { key: keyof Pairing; label: string }[] = [
    { key: "pairingNumber", label: "Pairing Number" },
    { key: "operatingDates", label: "Operating Dates" },
    { key: "blockTime", label: "Total Flight Credit" },
    { key: "tafb", label: "TAFB" },
    { key: "totalAllowance", label: "Total Allowance" },
  ];

  // Filter headers based on visible columns
  const visibleHeaders = headers.filter(header => visibleColumns.has(header.key));

  // Memoize the search term in lowercase to avoid recalculation
  const searchTermLower = useMemo(() => searchTerm.toLowerCase(), [searchTerm]);

  // Helper function to calculate flights per day for a pairing
  const getFlightsPerDay = useCallback((pairing: Pairing): number => {
    // Group flights by day of week
    const flightsByDay = new Map<number, number>();
    
    pairing.flights.forEach(flight => {
      flight.daysOfWeek.forEach(day => {
        flightsByDay.set(day, (flightsByDay.get(day) ?? 0) + 1);
      });
    });

    // Return the maximum number of flights in any day
    return Math.max(...Array.from(flightsByDay.values()));
  }, []);

  // Memoize the filtered and sorted data
  const filteredData = useMemo(() => {
    const sortableData = [...data];
    
    // Apply sorting if configured
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

    // Apply filters and search
    return sortableData.filter((item) => {
      // Check if we're only showing favorites
      if (filters.showFavoritesOnly && !favoritePairings.has(item.pairingNumber)) {
        return false;
      }

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

      // Check max flights per day filter
      const maxFlightsPerDay = parseInt(filters.maxFlightsPerDay);
      const matchesMaxFlights = !filters.maxFlightsPerDay || getFlightsPerDay(item) <= maxFlightsPerDay;

      return (matchesBasicInfo || matchesFlights) && matchesFilters && matchesMaxFlights;
    });
  }, [data, sortConfig, searchTermLower, filters, getFlightsPerDay, favoritePairings]);

  // Memoize the sort handler
  const requestSort = useCallback((key: keyof Pairing) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === key && prevConfig.direction === "ascending") {
        return { key, direction: "descending" };
      }
      return { key, direction: "ascending" };
    });
  }, []);

  // Memoize the sort indicator
  const getSortIndicator = useCallback((key: keyof Pairing) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "ascending" ? "▲" : "▼";
  }, [sortConfig]);

  // Memoize the duration formatter
  const formatDuration = useCallback((duration: string) => {
    const hours = Math.floor(parseInt(duration) / 100);
    const minutes = parseInt(duration) % 100;
    return `${hours}h ${minutes}m`;
  }, []);

  // Memoize the cell value formatter
  const formatCellValue = useCallback((key: keyof Pairing, value: string) => {
    if (key === 'blockTime' || key === 'tafb') {
      return formatDuration(value);
    }
    return value;
  }, [formatDuration]);

  // Handle row selection
  const handleRowClick = (pairingNumber: string) => {
    const newSelection = new Set(selectedPairingNumbers);
    if (newSelection.has(pairingNumber)) {
      newSelection.delete(pairingNumber);
    } else {
      newSelection.add(pairingNumber);
    }
    onSelectionChange(newSelection);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col gap-2 flex-1">
          <label className="font-medium">Search</label>
          <input
            type="text"
            placeholder="Search pairings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="ml-4 p-2 text-gray-400 hover:text-white"
          title="Display Settings"
        >
          ⚙️
        </button>
      </div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col gap-2">
          <label className="font-medium">Departure Time</label>
          <div className="flex items-center gap-2">
            <select
              value={filters.departureTimeCondition}
              onChange={(e) =>
                setFilters(prev => ({ ...prev, departureTimeCondition: e.target.value }))
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
                setFilters(prev => ({ ...prev, departureTimeAfter: e.target.value }))
              }
              className="p-2 border rounded"
            />
            {filters.departureTimeAfter && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, departureTimeAfter: "" }))}
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
                setFilters(prev => ({ ...prev, arrivalTimeCondition: e.target.value }))
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
                setFilters(prev => ({ ...prev, arrivalTimeBefore: e.target.value }))
              }
              className="p-2 border rounded"
            />
            {filters.arrivalTimeBefore && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, arrivalTimeBefore: "" }))}
                className="p-2 text-red-500 hover:text-red-700"
                title="Clear arrival time"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium">Max Flights Per Day</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={filters.maxFlightsPerDay}
              onChange={(e) => setFilters(prev => ({ ...prev, maxFlightsPerDay: e.target.value }))}
              placeholder="Enter max flights per day"
              className="p-2 border rounded flex-1"
            />
            {filters.maxFlightsPerDay && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, maxFlightsPerDay: "" }))}
                className="p-2 text-red-500 hover:text-red-700"
                title="Clear max flights filter"
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
                  setFilters(prev => {
                    const newExcludedDays = new Set(prev.excludedDays);
                    if (e.target.checked) {
                      newExcludedDays.add(index + 1);
                    } else {
                      newExcludedDays.delete(index + 1);
                    }
                    return { ...prev, excludedDays: newExcludedDays };
                  });
                }}
                className="rounded"
              />
              {day}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.showFavoritesOnly}
            onChange={(e) => setFilters(prev => ({ ...prev, showFavoritesOnly: e.target.checked }))}
            className="rounded"
          />
          Show Favorites Only
        </label>
      </div>
      <table className="min-w-full bg-gray-600 border-collapse">
        <thead>
          <tr>
            <th className="border-b p-2 w-[50px]"></th>
            {visibleHeaders.map((header) => (
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
            <tr 
              key={index} 
              className={`border-b text-center cursor-pointer hover:bg-gray-500 transition-colors ${
                selectedPairingNumbers.has(item.pairingNumber) ? 'bg-blue-800' : ''
              }`}
              onClick={() => handleRowClick(item.pairingNumber)}
            >
              <td className="p-2 border-b">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.pairingNumber);
                  }}
                  className={`text-xl ${favoritePairings.has(item.pairingNumber) ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-300 transition-colors`}
                  title={favoritePairings.has(item.pairingNumber) ? "Remove from favorites" : "Add to favorites"}
                >
                  ★
                </button>
              </td>
              {visibleHeaders.map((header) => (
                <td key={header.key} className="p-2 border-b">
                  {formatCellValue(header.key, String(item[header.key]))}
                </td>
              ))}
              <td className="p-2 border-b text-center">
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

      <DisplaySettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
      />
    </div>
  );
};

export default React.memo(PairingTable);
