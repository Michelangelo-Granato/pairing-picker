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
    arrivalTimeBefore: "",
  });

  const headers: { key: keyof Pairing; label: string }[] = [
    { key: "pairingNumber", label: "Pairing Number" },
    { key: "operatingDates", label: "Operating Dates" },
    { key: "blockTime", label: "Block Time" },
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
    const matchesSearchTerm =
      item.pairingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operatingDates.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = item.flights.every((flight) => {
      const departureTimeAfter =
        !filters.departureTimeAfter ||
        flight.departureTime >= filters.departureTimeAfter;
      const arrivalTimeBefore =
        !filters.arrivalTimeBefore ||
        flight.arrivalTime <= filters.arrivalTimeBefore;
      return departureTimeAfter && arrivalTimeBefore;
    });

    return matchesSearchTerm && matchesFilters;
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

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border rounded"
      />
      <div className="mb-4">
        <label className="mr-2">Departure Time After:</label>
        <input
          type="time"
          value={filters.departureTimeAfter}
          onChange={(e) =>
            setFilters({ ...filters, departureTimeAfter: e.target.value })
          }
          className="mr-4 p-2 border rounded"
        />
        <label className="mr-2">Arrival Time Before:</label>
        <input
          type="time"
          value={filters.arrivalTimeBefore}
          onChange={(e) =>
            setFilters({ ...filters, arrivalTimeBefore: e.target.value })
          }
          className="p-2 border rounded"
        />
      </div>
      <table className="min-w-full bg-gray-600 border-collapse">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                onClick={() => requestSort(header.key)}
                className="border-b p-2 cursor-pointer"
              >
                {header.label} {getSortIndicator(header.key)}
              </th>
            ))}
            <th className="border-b p-2">Flights</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={index} className="border-b text-center">
              {headers.map((header) => (
                <td key={header.key} className="p-2 border-b">
                  {item[header.key]}
                </td>
              ))}
              <td className="p-2 border-b">
                {item.flights.map((flight, idx) => (
                  <div key={idx} className="mb-2">
                    {flight.departure} - {flight.arrival} (
                    {flight.departureTime} - {flight.arrivalTime})
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
