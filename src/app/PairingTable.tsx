"use client";
import React, { useState } from "react";
import { Pairing } from "./parser";

interface PairingTableProps {
  data: Pairing[];
}

const PairingTable: React.FC<PairingTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Pairing;
    direction: "ascending" | "descending";
  } | null>(null);

  const sortedData = React.useMemo(() => {
    const sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const filteredData = sortedData.filter(
    (item) =>
      item.pairingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operatingDates.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <table className="min-w-full bg-gray-600 border-collapse">
        <thead>
          <tr>
            <th
              onClick={() => requestSort("pairingNumber")}
              className="border-b p-2 cursor-pointer"
            >
              Pairing Number {getSortIndicator("pairingNumber")}
            </th>
            <th
              onClick={() => requestSort("operatingDates")}
              className="border-b p-2 cursor-pointer"
            >
              Operating Dates {getSortIndicator("operatingDates")}
            </th>
            <th className="border-b p-2">Flights</th>
            <th
              onClick={() => requestSort("blockTime")}
              className="border-b p-2 cursor-pointer"
            >
              Block Time {getSortIndicator("blockTime")}
            </th>
            <th
              onClick={() => requestSort("tafb")}
              className="border-b p-2 cursor-pointer"
            >
              TAFB {getSortIndicator("tafb")}
            </th>
            <th
              onClick={() => requestSort("totalAllowance")}
              className="border-b p-2 cursor-pointer"
            >
              Total Allowance {getSortIndicator("totalAllowance")}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={index} className="border-b text-center">
              <td className="p-2 border-b">{item.pairingNumber}</td>
              <td className="p-2 border-b">{item.operatingDates}</td>
              <td className="p-2 border-b">
                {item.flights.map((flight, idx) => (
                  <div key={idx} className="mb-2">
                    {flight.departure} - {flight.arrival} (
                    {flight.departureTime} - {flight.arrivalTime})
                  </div>
                ))}
              </td>
              <td className="p-2 border-b">{item.blockTime}</td>
              <td className="p-2 border-b">{item.tafb}</td>
              <td className="p-2 border-b">{item.totalAllowance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PairingTable;
