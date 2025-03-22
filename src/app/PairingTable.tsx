"use client";
import React, { useState, useMemo, useCallback, useEffect, useRef, useTransition } from "react";
import { VariableSizeList as List } from 'react-window';
import { Pairing } from "./parser";
import FlightDisplay from "./FlightDisplay";
import DisplaySettings from "./DisplaySettings";
import debounce from 'lodash/debounce';

interface PairingTableProps {
  data: Pairing[];
  selectedPairingNumbers: Set<string>;
  onSelectionChange: (selectedPairingNumbers: Set<string>) => void;
}

// Memoize expensive computations outside component
const createFlightIndex = (pairing: Pairing) => {
  return pairing.flights.reduce((acc, flight) => {
    const layoverHotel = flight.hasLayover && flight.layover ? flight.layover.hotel.toLowerCase() : '';
    acc.push(
      flight.departure.toLowerCase(),
      flight.arrival.toLowerCase(),
      layoverHotel
    );
    return acc;
  }, [] as string[]).filter(Boolean).join(' ');
};

// Row component for virtualized list
const Row = React.memo(({ 
  data: { 
    items, 
    visibleHeaders, 
    formatCellValue, 
    handleRowClick, 
    toggleFavorite, 
    selectedPairingNumbers,
    favoritePairings 
  }, 
  index, 
  style 
}: {
  data: {
    items: Pairing[];
    visibleHeaders: { key: keyof Pairing; label: string }[];
    formatCellValue: (key: keyof Pairing, value: string) => string;
    handleRowClick: (pairingNumber: string) => void;
    toggleFavorite: (e: React.MouseEvent, pairingNumber: string) => void;
    selectedPairingNumbers: Set<string>;
    favoritePairings: Set<string>;
  };
  index: number;
  style: React.CSSProperties;
}) => {
  const item = items[index];
  
  return (
    <div 
      style={style}
      className={`flex border-b text-center cursor-pointer hover:bg-gray-500 transition-colors ${
        selectedPairingNumbers.has(item.pairingNumber) ? 'bg-blue-800' : ''
      }`}
      onClick={() => handleRowClick(item.pairingNumber)}
    >
      <div className="p-1 w-[60px] flex-shrink-0">
        <button
          onClick={(e) => toggleFavorite(e, item.pairingNumber)}
          className={`text-xl ${favoritePairings.has(item.pairingNumber) ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-300 transition-colors`}
        >
          ★
        </button>
      </div>
      <div className="p-1 w-[275px] flex-shrink-0 text-center">
        {item.flights.map((flight, idx) => (
          <div key={idx}>
            <FlightDisplay flight={flight} />
          </div>
        ))}
      </div>
      {visibleHeaders.map((header) => (
        <div key={header.key} className="p-1 w-[90px] flex-shrink-0 flex items-center justify-center h-full">
          {formatCellValue(header.key, String(item[header.key]))}
        </div>
      ))}
    </div>
  );
});

Row.displayName = 'Row';

const PairingTable: React.FC<PairingTableProps> = React.memo(({ 
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
    excludedDays: new Set<number>(),
    maxFlightsPerDay: "",
    showFavoritesOnly: false,
  });
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [isPending, startTransition] = useTransition();

  // Pre-compute flight indices for search
  const flightIndices = useMemo(() => {
    return new Map(data.map(pairing => [pairing.pairingNumber, createFlightIndex(pairing)]));
  }, [data]);

  // Debounced search term update
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => {
      startTransition(() => {
        setSearchTerm(value.toLowerCase());
      });
    }, 300),
    []
  );

  // Memoize headers
  const headers = useMemo(() => [
    { key: "pairingNumber", label: "Pairing Number" },
    { key: "operatingDates", label: "Operating Dates" },
    { key: "blockTime", label: "Total Flight Credit" },
    { key: "tafb", label: "TAFB" },
    { key: "totalAllowance", label: "Total Allowance" },
  ] as const, []);

  // Memoize visible headers
  const visibleHeaders = useMemo(() => 
    headers.filter(header => visibleColumns.has(header.key)),
    [headers, visibleColumns]
  );

  // Optimize flight count calculation
  const getFlightsPerDay = useCallback((pairing: Pairing): number => {
    const flightsByDay = new Map<number, number>();
    for (const flight of pairing.flights) {
      for (const day of flight.daysOfWeek) {
        flightsByDay.set(day, (flightsByDay.get(day) ?? 0) + 1);
      }
    }
    return Math.max(...Array.from(flightsByDay.values()));
  }, []);

  // Memoize filter function
  const filterPairing = useCallback((item: Pairing) => {
    // Early returns for quick filtering
    if (filters.showFavoritesOnly && !favoritePairings.has(item.pairingNumber)) {
      return false;
    }

    if (searchTerm) {
      const basicMatch = 
        item.pairingNumber.toLowerCase().includes(searchTerm) ||
        item.operatingDates.toLowerCase().includes(searchTerm);
      
      if (!basicMatch) {
        const flightIndex = flightIndices.get(item.pairingNumber);
        if (!flightIndex?.includes(searchTerm)) {
          return false;
        }
      }
    }

    // Check excluded days first as it's a quick operation
    if (filters.excludedDays.size > 0) {
      const hasExcludedDay = item.flights.some(flight => 
        flight.daysOfWeek.some(day => filters.excludedDays.has(day))
      );
      if (hasExcludedDay) return false;
    }

    // Check max flights per day
    const maxFlightsPerDay = parseInt(filters.maxFlightsPerDay);
    if (maxFlightsPerDay && getFlightsPerDay(item) > maxFlightsPerDay) {
      return false;
    }

    // Time-based filters
    if (filters.departureTimeAfter || filters.arrivalTimeBefore) {
      return item.flights.every((flight) => {
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
    }

    return true;
  }, [searchTerm, filters, favoritePairings, flightIndices, getFlightsPerDay]);

  // Memoize the filtered and sorted data
  const filteredData = useMemo(() => {
    const filtered = data.filter(filterPairing);
    
    if (sortConfig !== null) {
      return [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const numA = Number(aValue);
          const numB = Number(bValue);
          
          if (!isNaN(numA) && !isNaN(numB)) {
            return sortConfig.direction === "ascending"
              ? numA - numB
              : numB - numA;
          }
          
          return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    
    return filtered;
  }, [data, filterPairing, sortConfig]);

  // Optimize sort handler
  const requestSort = useCallback((key: keyof Pairing) => {
    startTransition(() => {
      setSortConfig(prevConfig => {
        if (prevConfig?.key === key && prevConfig.direction === "ascending") {
          return { key, direction: "descending" };
        }
        return { key, direction: "ascending" };
      });
    });
  }, []);

  // Memoize formatters
  const formatDuration = useCallback((duration: string) => {
    const hours = Math.floor(parseInt(duration) / 100);
    const minutes = parseInt(duration) % 100;
    return `${hours}h ${minutes}m`;
  }, []);

  const formatCellValue = useCallback((key: keyof Pairing, value: string) => {
    if (key === 'blockTime' || key === 'tafb') {
      return formatDuration(value);
    }
    return value;
  }, [formatDuration]);

  // Optimize row selection
  const handleRowClick = useCallback((pairingNumber: string) => {
    onSelectionChange(new Set(
      selectedPairingNumbers.has(pairingNumber)
        ? Array.from(selectedPairingNumbers).filter(num => num !== pairingNumber)
        : [...selectedPairingNumbers, pairingNumber]
    ));
  }, [selectedPairingNumbers, onSelectionChange]);

  // Optimize favorite toggling
  const toggleFavorite = useCallback((e: React.MouseEvent, pairingNumber: string) => {
    e.stopPropagation();
    setFavoritePairings(prev => {
      const next = new Set(prev);
      if (next.has(pairingNumber)) {
        next.delete(pairingNumber);
      } else {
        next.add(pairingNumber);
      }
      return next;
    });
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoritePairings');
    if (savedFavorites) {
      setFavoritePairings(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoritePairings', JSON.stringify(Array.from(favoritePairings)));
  }, [favoritePairings]);

  // Calculate total row height based on number of flights and layovers
  const getRowHeight = useCallback((index: number) => {
    const item = filteredData[index];
    const numFlights = item.flights.length;
    const numLayovers = item.flights.reduce((count, flight) => 
      count + (flight.hasLayover ? 1 : 0), 0);
    
    // height per flight (48px) + height per layover (48px)
    return 12 + (numFlights * 48) + (numLayovers * 48);
  }, [filteredData]);

  // Memoize row data to prevent unnecessary re-renders
  const rowData = useMemo(() => ({
    items: filteredData,
    visibleHeaders,
    formatCellValue,
    handleRowClick,
    toggleFavorite,
    selectedPairingNumbers,
    favoritePairings
  }), [
    filteredData,
    visibleHeaders,
    formatCellValue,
    handleRowClick,
    toggleFavorite,
    selectedPairingNumbers,
    favoritePairings
  ]);

  // Reference to the virtualized list
  const listRef = useRef<List>(null);

  // Reset list cache when data changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [filteredData]);

  return (
    <div>
      <div>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Search</label>
      <input
        type="text"
              placeholder="Search pairings..."
              onChange={(e) => debouncedSetSearchTerm(e.target.value)}
              className="p-2 border rounded w-full"
            />
          </div>
        </div>
        {isPending ? (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Departure Time</label>
              <div className="flex items-center gap-2">
        <select
          value={filters.departureTimeCondition}
          onChange={(e) =>
                    setFilters(prev => ({ ...prev, departureTimeCondition: e.target.value }))
          }
                  className="p-2 border rounded flex-1 min-w-[100px]"
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
                  className="p-2 border rounded flex-1"
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
                  className="p-2 border rounded flex-1 min-w-[100px]"
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
                  className="p-2 border rounded flex-1"
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
        )}
        <div className="mb-4">
          <label className="font-medium block mb-2">Exclude Days</label>
          <div className="flex flex-wrap gap-2 justify-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <label key={day} className="flex items-center gap-1 min-w-[70px]">
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
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.showFavoritesOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, showFavoritesOnly: e.target.checked }))}
              className="rounded"
            />
            Show Favorites Only
          </label>
          <div className="relative">
            <button
              ref={settingsButtonRef}
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="text-gray-400 hover:text-white flex items-center gap-2 p-2 rounded hover:bg-gray-600"
              title="Display Settings"
            >
              <span>⚙️</span>
              <span>Column Settings</span>
            </button>
            {isSettingsOpen && (
              <DisplaySettings
                isOpen={true}
                onClose={() => setIsSettingsOpen(false)}
                visibleColumns={visibleColumns}
                onToggleColumn={(column) => {
                  setVisibleColumns(prev => {
                    const newColumns = new Set(prev);
                    if (newColumns.has(column)) {
                      newColumns.delete(column);
                    } else {
                      newColumns.add(column);
                    }
                    return newColumns;
                  });
                }}
                buttonRef={settingsButtonRef}
              />
            )}
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[1000px] px-2 sm:px-0">
            <div className="w-full bg-gray-600">
              <div className="flex border-b">
                <div className="p-1 w-[60px] flex-shrink-0"></div>
                <div className="p-1 w-[275px] flex-shrink-0 text-center">Flights</div>
                {visibleHeaders.map((header) => (
                  <div
                    key={header.key}
                    onClick={() => requestSort(header.key)}
                    className="p-1 cursor-pointer w-[90px] flex-shrink-0 text-center"
                  >
                    {header.label} {sortConfig?.key === header.key && (sortConfig.direction === "ascending" ? "▲" : "▼")}
                  </div>
                ))}
              </div>
              {isPending ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-white"></div>
                </div>
              ) : (
                <List
                  ref={listRef}
                  height={600}
                  itemCount={filteredData.length}
                  itemData={rowData}
                  itemSize={getRowHeight}
                  width="100%"
                >
                  {Row}
                </List>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PairingTable.displayName = 'PairingTable';

export default PairingTable;
